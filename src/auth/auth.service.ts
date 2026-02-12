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

function getFrontendBaseUrl(): string {
  const v =
    process.env.FRONT_URL ||
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://savetheplate.tn'
      : 'http://localhost:3000');
  return String(v || '').replace(/\/$/, '');
}

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

      const link = `${getFrontendBaseUrl()}/callback/${emailToken}`;

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
    // Track created user so we can roll back if a later step fails
    let createdUserId: number | null = null;

    try {
      // Ensure JWT secret is configured before doing any writes to avoid partial signups
      if (!process.env.JWT_SECRET) {
        throw new HttpException(
          'Server configuration error: missing JWT secret',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

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
      createdUserId = user.id;

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
      // If user was created but a later step failed (e.g., token generation), clean up to avoid orphaned accounts
      const errorObj = error as any;
      const shouldAttemptCleanup =
        errorObj?.status === HttpStatus.INTERNAL_SERVER_ERROR ||
        !(error instanceof HttpException);
      if (shouldAttemptCleanup) {
        try {
          // Only delete if we actually created a user in this execution
          if (typeof createdUserId === 'number') {
            await this.prisma.user.delete({ where: { id: createdUserId } });
          }
        } catch (cleanupError) {
          console.error('Signup cleanup failed:', cleanupError);
        }
      }

      // Handle Prisma unique constraint violations
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

      // Render React component to HTML (simple email with just the code)
      const emailHtml = await render(
        VerificationEmailTemplate({ 
          verificationCode, // Only include code, no link
        }),
      );

      // For local dev: Log the code
      if (process.env.NODE_ENV === 'development') {
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

  // Facebook OAuth Callback Handler
  async facebookCallback(code: string): Promise<any> {
    try {
      if (!code) {
        throw new HttpException(
          'Authorization code is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Exchange code for access token
      const facebookAccessToken = await this.exchangeFacebookCodeForToken(code);

      // Get user info from Facebook
      const facebookUser = await this.getFacebookUserInfo(facebookAccessToken);

      if (!facebookUser.email) {
        throw new HttpException(
          'Unable to retrieve email from Facebook account. Please ensure your email is public on Facebook.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find or create user (case-insensitive email lookup)
      let user = await this.prisma.user.findFirst({
        where: {
          email: facebookUser.email.toLowerCase(),
        },
      });

      // If not found, try case-insensitive search
      if (!user) {
        const users = await this.prisma.$queryRaw<Array<{ id: number; email: string }>>`
          SELECT id, email FROM "User" WHERE LOWER(email) = LOWER(${facebookUser.email.toLowerCase()}) LIMIT 1
        `;
        if (users && users.length > 0) {
          user = await this.prisma.user.findUnique({
            where: { id: users[0].id },
          });
        }
      }

      // If user doesn't exist, create them
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: facebookUser.email.toLowerCase(),
            username: facebookUser.name || facebookUser.email.split('@')[0],
            role: UserRole.NONE, // New users need onboarding
            profileImage: facebookUser.picture?.data?.url || '',
          },
        });
      } else {
        // Update user's profile image if they don't have one
        if (!user.profileImage && facebookUser.picture?.data?.url) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              profileImage: facebookUser.picture.data.url,
            },
          });
        }
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
        message: 'Facebook authentication successful',
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
          emailVerified: user.emailVerified,
        },
        needsOnboarding: user.role === UserRole.NONE,
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Facebook callback error:', error);
      throw new HttpException(
        'Facebook authentication failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Facebook Access Token Handler (for JavaScript SDK flow)
  async facebookAccessToken(facebookAccessToken: string): Promise<any> {
    try {
      if (!facebookAccessToken) {
        throw new HttpException(
          'Access token is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get user info from Facebook using the provided access token
      const facebookUser = await this.getFacebookUserInfo(facebookAccessToken);

      if (!facebookUser.email) {
        throw new HttpException(
          'Unable to retrieve email from Facebook account. Please ensure your email is public on Facebook.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find or create user (case-insensitive email lookup)
      let user = await this.prisma.user.findFirst({
        where: {
          email: facebookUser.email.toLowerCase(),
        },
      });

      // If not found, try case-insensitive search
      if (!user) {
        const users = await this.prisma.$queryRaw<Array<{ id: number; email: string }>>`
          SELECT id, email FROM "User" WHERE LOWER(email) = LOWER(${facebookUser.email.toLowerCase()}) LIMIT 1
        `;
        if (users && users.length > 0) {
          user = await this.prisma.user.findUnique({
            where: { id: users[0].id },
          });
        }
      }

      // If user doesn't exist, create them
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: facebookUser.email.toLowerCase(),
            username: facebookUser.name || facebookUser.email.split('@')[0],
            role: UserRole.NONE, // New users need onboarding
            profileImage: facebookUser.picture?.data?.url || '',
          },
        });
      } else {
        // Update user's profile image if they don't have one
        if (!user.profileImage && facebookUser.picture?.data?.url) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              profileImage: facebookUser.picture.data.url,
            },
          });
        }
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
        message: 'Facebook authentication successful',
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
          emailVerified: user.emailVerified,
        },
        needsOnboarding: user.role === UserRole.NONE,
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Facebook access token error:', error);
      throw new HttpException(
        'Facebook authentication failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Exchange Facebook authorization code for access token
  private async exchangeFacebookCodeForToken(code: string): Promise<string> {
    try {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      const redirectUri = this.getFacebookRedirectUri();

      if (!appId || !appSecret) {
        throw new HttpException(
          'Facebook credentials not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code: code,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Facebook token exchange error:', errorData);
        throw new HttpException(
          'Failed to exchange authorization code',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new HttpException(
          'No access token returned from Facebook',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return data.access_token;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error exchanging Facebook code:', error);
      throw new HttpException(
        'Failed to authenticate with Facebook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get user info from Facebook using access token
  private async getFacebookUserInfo(accessToken: string): Promise<any> {
    try {
      const fields = 'id,email,name,picture.type(large)';
      const url = `https://graph.facebook.com/v18.0/me?fields=${fields}&access_token=${accessToken}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Facebook user info error:', errorData);
        throw new HttpException(
          'Failed to fetch user information from Facebook',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching Facebook user info:', error);
      throw new HttpException(
        'Failed to get user information from Facebook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get redirect URI for Facebook OAuth
  private getFacebookRedirectUri(): string {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return `${backendUrl}/auth/facebook/callback`;
  }

  // Google OAuth Handler (for Google Sign-In token verification)
  async googleAuth(token: string): Promise<any> {
    try {
      if (!token) {
        throw new HttpException(
          'Google ID Token is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Import google-auth-library for token verification
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      // Verify and decode the token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload.email) {
        throw new HttpException(
          'Unable to retrieve email from Google account',
          HttpStatus.BAD_REQUEST,
        );
      }

      const googleId = payload.sub;
      const email = payload.email.toLowerCase();
      const username = payload.name || email.split('@')[0];
      const profileImage = payload.picture || '';

      // Find user by googleId first, then by email
      let user = await this.prisma.user.findFirst({
        where: {
          googleId,
        },
      });

      // If not found by googleId, try finding by email
      if (!user) {
        user = await this.prisma.user.findFirst({
          where: {
            email,
          },
        });

        // If found by email, link the Google account
        if (user) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              // Update profile image if user doesn't have one
              profileImage: user.profileImage || profileImage,
            },
          });
        }
      }

      // If user doesn't exist, create them
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            googleId,
            username,
            role: UserRole.NONE, // New users need onboarding
            profileImage,
            emailVerified: true, // Google emails are pre-verified
          },
        });
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

      // Determine if this is a new user (just created)
      const isNewUser = user.role === UserRole.NONE;

      return {
        message: 'Google authentication successful',
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
          emailVerified: user.emailVerified || true,
        },
        isNewUser,
        needsOnboarding: isNewUser,
      };
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Google auth error:', error);
      throw new HttpException(
        'Google authentication failed. Please ensure your token is valid.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

