import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { ResendService } from 'src/utils/mailing/resend.service';
import { CacheService } from 'src/cache/cache.service';
import MagicLinkEmailTemplate from 'src/emails/MagicLink';
import VerificationEmailTemplate from 'src/emails/VerificationEmail';
import { render } from '@react-email/render';
import {
  AuthMagicMailSenderDtoRequest,
  AuthMagicMailVerifierDtoRequest,
  AuthMagicMailVerifierDtoResponse,
  SignupDtoRequest,
  SignupDtoResponse,
  SigninDtoRequest,
  SigninDtoResponse,
  SendVerificationEmailDtoRequest,
  SendVerificationEmailDtoResponse,
  VerifyEmailCodeDtoRequest,
  VerifyEmailCodeDtoResponse,
} from './dto/auth-request.dto';
import { generateToken, JwtType, DecodeToken } from 'src/utils/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly resend: ResendService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  // Send a magic link email to the user
  async AuthMagicMailSender(
    AuthUserDto: AuthMagicMailSenderDtoRequest,
  ): Promise<any> {
    try {
      // Check if user exists
      let user = await this.prisma.user.findFirst({
        where: {
          email: AuthUserDto.email,
        },
      });

      if (!user) {
        // Create user by email if not found
        const username = AuthUserDto.email.split('@')[0];
        user = await this.prisma.user.create({
          data: {
            email: AuthUserDto.email,
            username: username,
            role: UserRole.NONE, // Set initial role to NONE
          },
        });
      }

      // Generate token from email and user ID
      const emailToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.EmailToken,
      );

      const link = `${process.env.FRONT_URL}/callback/${emailToken}`;

      // For local dev: Skip email and return the link directly
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔗 Magic Link (Local Dev):', link);
        return {
          message: `Magic link generated for ${user.email}`,
          sent: true,
          magicLink: link, // Return link directly in dev mode
          emailToken, // Also return the token
        };
      }

      // Production: Send actual email
      // Render React component to HTML
      const emailHtml = await render(
        MagicLinkEmailTemplate({ magicLink: link }),
      );

      const mail_resp = await this.resend.getResendInstance().emails.send({
        from: 'Save The Plate <no-reply@savetheplate.tn>',
        to: user.email,
        subject: 'Log in to SaveThePlate',
        html: emailHtml,
      });

      if (mail_resp.error) {
        throw new Error(mail_resp.error.message);
      }

      return {
        message: `Email sent to: ${user.email}`,
        sent: true,
      };
    } catch (error) {
      // Log technical details for debugging
      console.error('Magic mail sender error:', error);
      
      // Provide user-friendly error message
      const errorMessage = 'Unable to send magic link email. Please try again later.';
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  // Verify the magic mail token and return user info
  async AuthMagicMailVerifier(
    AuthUserDto: AuthMagicMailVerifierDtoRequest,
  ): Promise<AuthMagicMailVerifierDtoResponse> {
    try {
      // Validate token is provided
      if (!AuthUserDto.token || typeof AuthUserDto.token !== 'string') {
        throw new HttpException(
          'Token is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Decode token to get user data
      const dataFromToken = await DecodeToken(AuthUserDto.token);

      if (!dataFromToken || !dataFromToken.id || !dataFromToken.email) {
        throw new HttpException(
          'Invalid token format',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find the user
      const user = await this.prisma.user.findFirst({
        where: {
          id: Number(dataFromToken.id),
        },
      });

      // Check if user exists
      if (!user) {
        return await this.createUser(dataFromToken.email);
      }

      // Generate tokens
      const accessToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.NormalToken,
      );

      const refreshToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.RefreshToken,
      );

      // Check the user role
      if (user.role === UserRole.NONE) {
        return {
          message: 'User needs onboarding.',
          accessToken,
          refreshToken,
          user,
          redirectToOnboarding: true, // Indicate that the user should be redirected
        };
      }

      return {
        message: 'User Verified',
        accessToken,
        refreshToken,
        user,
        redirectToOnboarding: false, // Existing user does not need onboarding
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Log the error for debugging
      const errorObj = error as any;
      console.error('Verify magic mail error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        code: errorObj?.code,
        stack: error instanceof Error ? error.stack : errorObj?.stack,
      });

      // Provide user-friendly error message
      const errorMessage = 'Token is not valid or expired. Please request a new magic link.';
      throw new HttpException(
        errorMessage,
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  // Create a new user and generate tokens
  async createUser(email: string) {
    const username = email.split('@')[0];
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        role: UserRole.NONE, // Default role
      },
    });

    // Generate and return access and refresh tokens
    const accessToken = await generateToken(
      user.id.toString(),
      user.email,
      JwtType.NormalToken,
    );

    const refreshToken = await generateToken(
      user.id.toString(),
      user.email,
      JwtType.RefreshToken,
    );

    return {
      message: 'User Created',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        location: user.location || '',
        phoneNumber: user.phoneNumber || '',
        profileImage: user.profileImage || '',
        role: user.role,
      },
      needsOnboarding: true, // New user needs to complete onboarding
    };
  }

  // Signin with email and password
  async signin(signinDto: SigninDtoRequest): Promise<SigninDtoResponse> {
    try {
      // Validate input
      if (!signinDto.email || !signinDto.password) {
        throw new HttpException(
          'Email and password are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = signinDto.email.toLowerCase().trim();

      // Find user by email (case-insensitive using raw query for PostgreSQL)
      // First try exact match with normalized email
      let user = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
        },
      });

      // If not found, try case-insensitive search using raw query
      if (!user) {
        const users = await this.prisma.$queryRaw<Array<{ id: number; email: string; password: string | null; username: string; location: string | null; mapsLink: string | null; longitude: number | null; latitude: number | null; phoneNumber: number | null; profileImage: string | null; role: string; emailVerified: boolean }>>`
          SELECT * FROM "User" WHERE LOWER(email) = LOWER(${normalizedEmail}) LIMIT 1
        `;
        if (users && users.length > 0) {
          // Convert raw result to match Prisma User type
          user = await this.prisma.user.findUnique({
            where: { id: users[0].id },
          });
        }
      }

      if (!user) {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Check if user has a password (users created via magic link might not have one)
      // COMMENTED OUT: Magic link disabled, focusing on password-based auth only
      // if (!user.password) {
      //   throw new HttpException(
      //     'This account was created with a magic link. Please use magic link to sign in.',
      //     HttpStatus.UNAUTHORIZED,
      //   );
      // }
      
      // If user doesn't have a password, they can't sign in with password
      if (!user.password) {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Verify password using bcrypt
      // Debug logging to diagnose password comparison issues
      console.log('Password verification debug:', {
        email: normalizedEmail,
        providedPasswordLength: signinDto.password?.length,
        storedPasswordHash: user.password ? `${user.password.substring(0, 20)}...` : 'null',
        storedPasswordLength: user.password?.length,
      });

      const isPasswordValid = await bcrypt.compare(
        signinDto.password,
        user.password,
      );

      console.log('Password comparison result:', {
        isValid: isPasswordValid,
        email: normalizedEmail,
      });

      if (!isPasswordValid) {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Generate tokens
      const accessToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.NormalToken,
      );

      const refreshToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.RefreshToken,
      );

      return {
        message: 'Sign in successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          location: user.location || '',
          phoneNumber: user.phoneNumber?.toString() || '',
          profileImage: user.profileImage || '',
          role: user.role,
          emailVerified: user.emailVerified || false,
        },
        role: user.role,
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Log the error for debugging
      const errorObj = error as any;
      console.error('Signin error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        code: errorObj?.code,
        stack: error instanceof Error ? error.stack : errorObj?.stack,
      });

      // Provide user-friendly error message
      const errorMessage = 'Unable to sign in. Please check your credentials and try again.';
      throw new HttpException(
        errorMessage,
        HttpStatus.UNAUTHORIZED,
        {
          cause: error,
        },
      );
    }
  }

  // Signup with email, username, and password
  async signup(signupDto: SignupDtoRequest): Promise<SignupDtoResponse> {
    try {
      // Validate input
      if (!signupDto.email || !signupDto.username || !signupDto.password) {
        throw new HttpException(
          'Email, username, and password are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Normalize email to lowercase for consistent storage
      const normalizedEmail = signupDto.email.toLowerCase().trim();

      // Check if user already exists (case-insensitive)
      // First try exact match with normalized email
      let existingUser = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
        },
      });

      // If not found, try case-insensitive search using raw query
      if (!existingUser) {
        const users = await this.prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM "User" WHERE LOWER(email) = LOWER(${normalizedEmail}) LIMIT 1
        `;
        if (users && users.length > 0) {
          existingUser = await this.prisma.user.findUnique({
            where: { id: users[0].id },
          });
        }
      }

      if (existingUser) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(signupDto.password, 10);

      // Create new user with normalized email
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          username: signupDto.username,
          password: hashedPassword,
          role: UserRole.NONE, // Default role
        },
      });

      // Generate tokens
      const accessToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.NormalToken,
      );

      const refreshToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.RefreshToken,
      );

      return {
        message: 'User created successfully',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          location: user.location || '',
          phoneNumber: user.phoneNumber?.toString() || '',
          profileImage: user.profileImage || '',
          role: user.role,
          emailVerified: user.emailVerified || false,
        },
        needsOnboarding: true, // New user needs to complete onboarding
      };
    } catch (error) {
      // Handle Prisma unique constraint violations
      const errorObj = error as any;
      if (errorObj?.code === 'P2002') {
        throw new HttpException(
          'User with this email or username already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Log the error for debugging
      console.error('Signup error:', {
        message: error instanceof Error ? error.message : errorObj?.message,
        code: errorObj?.code,
        stack: error instanceof Error ? error.stack : errorObj?.stack,
      });

      // Provide user-friendly error message
      const errorMessage = 'Unable to create account. Please check your information and try again.';
      throw new HttpException(
        errorMessage,
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  // Send verification email to user
  async sendVerificationEmail(
    sendVerificationDto: SendVerificationEmailDtoRequest,
  ): Promise<SendVerificationEmailDtoResponse> {
    try {
      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = sendVerificationDto.email.toLowerCase().trim();

      // Find the user by email (case-insensitive)
      let user = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
        },
      });

      // If not found, try case-insensitive search using raw query
      if (!user) {
        const users = await this.prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM "User" WHERE LOWER(email) = LOWER(${normalizedEmail}) LIMIT 1
        `;
        if (users && users.length > 0) {
          user = await this.prisma.user.findUnique({
            where: { id: users[0].id },
          });
        }
      }

      if (!user) {
        throw new HttpException(
          'User with this email does not exist',
          HttpStatus.NOT_FOUND,
        );
      }

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in cache for 10 minutes
      // Note: cache-manager TTL is in milliseconds for some stores, but seconds for others
      // Using 600000 milliseconds (10 minutes) to be safe
      // Use normalized email for cache key to ensure consistency
      const cacheKey = `verification_code:${normalizedEmail}`;
      try {
        // Try with milliseconds first (600000 = 10 minutes)
        await this.cacheService.set(cacheKey, verificationCode, 600000);
        
        // Verify code was stored (for debugging)
        const testCode = await this.cacheService.get<string>(cacheKey);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Code stored in cache:', testCode === verificationCode ? '✅' : '❌');
          console.log('🔑 Cache key:', cacheKey);
          console.log('🔐 Expected code:', verificationCode);
          console.log('🔐 Retrieved code:', testCode);
        }
        
        if (!testCode || testCode !== verificationCode) {
          console.error('⚠️ Cache storage failed! Code may not persist.');
        }
      } catch (cacheError) {
        console.error('❌ Cache error:', cacheError);
        // Continue anyway - code will be in email
      }

      // Generate email verification token (for link fallback)
      const emailToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.EmailToken,
      );

      const verificationLink = `${process.env.FRONT_URL}/callback/${emailToken}`;

      // Render React component to HTML (use verification email template with code)
      const emailHtml = await render(
        VerificationEmailTemplate({ 
          verificationLink,
          verificationCode, // Include code in email
        }),
      );

      // For local dev: Log the link and code but still try to send email
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔗 Verification Link (Local Dev):', verificationLink);
        console.log('🔐 Verification Code:', verificationCode);
        console.log('📧 Attempting to send email to:', user.email);
      }

      // Send actual email (works in both dev and production)
      const mail_resp = await this.resend.getResendInstance().emails.send({
        from: 'Save The Plate <no-reply@savetheplate.tn>',
        to: user.email,
        subject: 'Verify your email - SaveThePlate',
        html: emailHtml,
      });

      if (mail_resp.error) {
        console.error('❌ Email sending error:', mail_resp.error);
        throw new Error(mail_resp.error.message);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Email sent successfully!');
        console.log('📧 Email ID:', mail_resp.data?.id);
      }

      return {
        message: `Verification email sent to: ${user.email}`,
        sent: true,
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Provide user-friendly error message
      const errorMessage = 'Unable to send verification email. Please try again later.';
      throw new HttpException(
        errorMessage,
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  // Verify email code
  async verifyEmailCode(
    verifyCodeDto: VerifyEmailCodeDtoRequest,
  ): Promise<VerifyEmailCodeDtoResponse> {
    try {
      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = verifyCodeDto.email.toLowerCase().trim();

      // Find the user by email (case-insensitive)
      let user = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
        },
      });

      // If not found, try case-insensitive search using raw query
      if (!user) {
        const users = await this.prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM "User" WHERE LOWER(email) = LOWER(${normalizedEmail}) LIMIT 1
        `;
        if (users && users.length > 0) {
          user = await this.prisma.user.findUnique({
            where: { id: users[0].id },
          });
        }
      }

      if (!user) {
        throw new HttpException(
          'User with this email does not exist',
          HttpStatus.NOT_FOUND,
        );
      }

      // Get stored verification code from cache
      // Use normalized email for cache key to ensure consistency
      const cacheKey = `verification_code:${normalizedEmail}`;
      let storedCode = await this.cacheService.get<string>(cacheKey);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Looking for code with key:', cacheKey);
        console.log('🔍 Stored code found:', storedCode ? `✅ (${storedCode})` : '❌');
        console.log('🔍 Code provided:', verifyCodeDto.code);
      }

      // If code not found, try without the prefix (in case of key mismatch)
      if (!storedCode) {
        // Try alternative key format
        const altKey = `verification_code:${verifyCodeDto.email}`;
        storedCode = await this.cacheService.get<string>(altKey);
        if (process.env.NODE_ENV === 'development' && storedCode) {
          console.log('🔍 Found code with alternative key:', altKey);
        }
      }

      if (!storedCode) {
        throw new HttpException(
          'Verification code has expired or was not found. Please request a new one.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Compare codes (trim whitespace, handle string conversion)
      const providedCode = String(verifyCodeDto.code).trim();
      const cachedCode = String(storedCode).trim();

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Comparing codes:');
        console.log('  - Cached:', cachedCode);
        console.log('  - Provided:', providedCode);
        console.log('  - Match:', cachedCode === providedCode);
      }

      if (cachedCode !== providedCode) {
        throw new HttpException(
          'Invalid verification code. Please check and try again.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Code is valid, delete it from cache
      await this.cacheService.del(cacheKey);

      // Update user email verification status
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      // Invalidate user cache
      await this.cacheService.invalidateUsers(user.id, user.email);

      return {
        verified: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Provide user-friendly error message
      const errorMessage = 'Unable to verify email code. Please check the code and try again.';
      throw new HttpException(
        errorMessage,
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  // Get user by token (for protected routes)
  async GetUserByToken(req: Request): Promise<User> {
    try {
      return req['user'];
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Token is not valid or expired.',
        },
        HttpStatus.FORBIDDEN,
        {
          cause: e,
        },
      );
    }
  }
}
