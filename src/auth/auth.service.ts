import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { ResendService } from 'src/utils/mailing/resend.service';
import MagicLinkEmailTemplate from 'emails/MagicLink';
import { render } from '@react-email/render';
import {
  AuthMagicMailSenderDtoRequest,
  AuthMagicMailVerifierDtoRequest,
  AuthMagicMailVerifierDtoResponse,
  GoogleAuthDtoRequest,
  GoogleAuthDtoResponse,
  FacebookAuthDtoRequest,
  FacebookAuthDtoResponse,
  FacebookCallbackDtoRequest,
  FacebookCallbackDtoResponse,
} from './dto/auth-request.dto';
import { generateToken, JwtType, DecodeToken } from 'src/utils/jwt';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly resend: ResendService,
    private readonly prisma: PrismaService,
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

      // Plain text version for better deliverability
      const emailText = `Bienvenue sur SaveThePlate! 🎉

Rejoignez-nous pour réduire le gaspillage alimentaire et sauver la planète, un repas à la fois 🌍

Cliquez sur ce lien pour vous connecter:
${link}

Ce lien expire dans 10 minutes.

Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email en toute sécurité.

Merci de faire partie de la communauté Save The Plate ! 🌱`;

      const mail_resp = await this.resend.getResendInstance().emails.send({
        from: 'Save The Plate <no-reply@ccdev.space>',
        to: user.email,
        subject: 'Log in to SaveThePlate',
        html: emailHtml,
        text: emailText, // Plain text version improves deliverability
        // Add reply-to if configured (improves sender reputation)
        ...(process.env.REPLY_TO_EMAIL && {
          replyTo: process.env.REPLY_TO_EMAIL,
        }),
        headers: {
          // These headers help with deliverability
          'X-Entity-Ref-ID': emailToken.substring(0, 20), // Unique identifier for tracking
        },
      });

      if (mail_resp.error) {
        throw new Error(mail_resp.error.message);
      }

      return {
        message: `Email sent to: ${user.email}`,
        sent: true,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message || 'Error sending email.',
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
      // Decode token to get user data
      const dataFromToken = await DecodeToken(AuthUserDto.token);

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
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Token is not valid or expired.',
        },
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

  // Authenticate user with Google OAuth
  async authenticateWithGoogle(
    googleAuthDto: GoogleAuthDtoRequest,
  ): Promise<GoogleAuthDtoResponse> {
    try {
      // Initialize Google OAuth client
      // The client ID should match the one used in the frontend
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Google OAuth is not configured on the server.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const client = new OAuth2Client(clientId);

      // Verify the Google ID token
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken: googleAuthDto.credential,
          audience: clientId,
        });
      } catch (error) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            error: 'Invalid Google credential token.',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Get user information from the token
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Unable to extract user information from Google token.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      const picture = payload.picture || null;

      // Check if user exists
      let user = await this.prisma.user.findFirst({
        where: {
          email: email,
        },
      });

      // Create user if doesn't exist
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: email,
            username: name,
            role: UserRole.NONE,
            profileImage: picture,
          },
        });
      } else {
        // Update profile image if it's not set and Google provides one
        if (!user.profileImage && picture) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { profileImage: picture },
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

      // Determine redirect path based on role
      let redirectTo = '/onboarding';
      if (user.role === UserRole.PROVIDER) {
        redirectTo = '/provider/home';
      } else if (user.role === UserRole.PENDING_PROVIDER) {
        redirectTo = '/onboarding/thank-you';
      } else if (user.role === UserRole.CLIENT) {
        redirectTo = '/client/home';
      }

      return {
        message: user.role === UserRole.NONE ? 'User needs onboarding.' : 'User authenticated successfully.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        role: user.role,
        needsOnboarding: user.role === UserRole.NONE,
        redirectTo,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'Error authenticating with Google.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  // Authenticate user with Facebook OAuth
  async authenticateWithFacebook(
    facebookAuthDto: FacebookAuthDtoRequest,
  ): Promise<FacebookAuthDtoResponse> {
    try {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;

      if (!appId || !appSecret) {
        console.error('[Facebook Auth] Missing environment variables:', {
          hasAppId: !!appId,
          hasAppSecret: !!appSecret,
        });
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Facebook OAuth is not configured on the server. Please check FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Validate access token is provided
      if (!facebookAuthDto.accessToken) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Facebook access token is required.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // First, verify the access token and get user info from Facebook Graph API
      let userInfo;
      try {
        console.log('[Facebook Auth] Fetching user info from Facebook Graph API');
        // Verify token and get user info in one call
        const response = await axios.get(
          `https://graph.facebook.com/me`,
          {
            params: {
              access_token: facebookAuthDto.accessToken,
              fields: 'id,name,email,picture',
            },
          },
        );

        userInfo = response.data;
        console.log('[Facebook Auth] User info retrieved:', {
          id: userInfo?.id,
          name: userInfo?.name,
          hasEmail: !!userInfo?.email,
        });

        // Verify that the token belongs to our app
        console.log('[Facebook Auth] Verifying token with debug_token endpoint');
        const debugResponse = await axios.get(
          `https://graph.facebook.com/debug_token`,
          {
            params: {
              input_token: facebookAuthDto.accessToken,
              access_token: `${appId}|${appSecret}`,
            },
          },
        );

        const tokenData = debugResponse.data.data;
        console.log('[Facebook Auth] Token debug data:', {
          isValid: tokenData?.is_valid,
          appId: tokenData?.app_id,
          expectedAppId: appId,
          userId: tokenData?.user_id,
        });

        if (!tokenData) {
          console.error('[Facebook Auth] No token data returned from debug_token');
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: 'Invalid Facebook access token. No token data returned.',
            },
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (tokenData.app_id !== appId) {
          console.error('[Facebook Auth] Token app_id mismatch:', {
            tokenAppId: tokenData.app_id,
            expectedAppId: appId,
          });
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: `Invalid Facebook access token. Token belongs to app ${tokenData.app_id}, but expected ${appId}.`,
            },
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (!tokenData.is_valid) {
          console.error('[Facebook Auth] Token is not valid:', tokenData);
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: `Facebook access token is not valid. Reason: ${tokenData.error?.message || 'Unknown error'}.`,
            },
            HttpStatus.UNAUTHORIZED,
          );
        }
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        
        // Log the error for debugging
        console.error('[Facebook Auth] Error verifying token:', {
          message: error?.message,
          responseStatus: error?.response?.status,
          responseData: error?.response?.data,
          stack: error?.stack,
        });

        if (error.response?.status === 401 || error.response?.status === 400) {
          const errorMessage = error.response?.data?.error?.message || 'Invalid Facebook access token.';
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: `Facebook authentication failed: ${errorMessage}`,
            },
            HttpStatus.UNAUTHORIZED,
          );
        }
        
        // If it's an axios error, provide more details
        if (error.response) {
          throw new HttpException(
            {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              error: `Error verifying Facebook token: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: `Error verifying Facebook token: ${error.message || 'Unknown error'}`,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Extract user information
      if (!userInfo) {
        console.error('[Facebook Auth] No user info returned from Facebook');
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Unable to extract user information from Facebook token.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!userInfo.email) {
        console.error('[Facebook Auth] Email not provided by Facebook:', userInfo);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Unable to extract email from Facebook token. Email permission is required. Please grant email permission when signing in with Facebook.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const email = userInfo.email;
      const name = userInfo.name || email.split('@')[0];
      // Extract profile image URL from Facebook response
      // Facebook Graph API returns picture in format: { picture: { data: { url: "..." } } }
      let picture = userInfo.picture?.data?.url || userInfo.picture?.url || null;

      console.log('[Facebook Auth] Processing user:', {
        email,
        name,
        hasPicture: !!picture,
      });

      // Check if user exists
      let user;
      try {
        user = await this.prisma.user.findFirst({
          where: {
            email: email,
          },
        });
      } catch (dbError) {
        console.error('[Facebook Auth] Database error when finding user:', dbError);
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Database error when checking user existence.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Create user if doesn't exist
      if (!user) {
        try {
          console.log('[Facebook Auth] Creating new user');
          user = await this.prisma.user.create({
            data: {
              email: email,
              username: name,
              role: UserRole.NONE,
              profileImage: picture,
            },
          });
          console.log('[Facebook Auth] User created:', user.id);
        } catch (dbError) {
          console.error('[Facebook Auth] Database error when creating user:', dbError);
          throw new HttpException(
            {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              error: `Database error when creating user: ${dbError.message || 'Unknown error'}`,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        console.log('[Facebook Auth] User exists, updating if needed');
        // Update profile image if it's not set and Facebook provides one
        if (!user.profileImage && picture) {
          try {
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: { profileImage: picture },
            });
          } catch (dbError) {
            console.error('[Facebook Auth] Error updating profile image:', dbError);
            // Don't throw - continue with existing image
          }
        }
        // Update username if it changed on Facebook
        if (user.username !== name) {
          try {
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: { username: name },
            });
          } catch (dbError) {
            console.error('[Facebook Auth] Error updating username:', dbError);
            // Don't throw - continue with existing username
          }
        }
      }

      // Generate tokens
      console.log('[Facebook Auth] Generating JWT tokens');
      let accessToken, refreshToken;
      try {
        accessToken = await generateToken(
          user.id.toString(),
          user.email,
          JwtType.NormalToken,
        );

        refreshToken = await generateToken(
          user.id.toString(),
          user.email,
          JwtType.RefreshToken,
        );
      } catch (tokenError) {
        console.error('[Facebook Auth] Error generating tokens:', tokenError);
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error generating authentication tokens.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Determine redirect path based on role
      let redirectTo = '/onboarding';
      if (user.role === UserRole.PROVIDER) {
        redirectTo = '/provider/home';
      } else if (user.role === UserRole.PENDING_PROVIDER) {
        redirectTo = '/onboarding/thank-you';
      } else if (user.role === UserRole.CLIENT) {
        redirectTo = '/client/home';
      }

      console.log('[Facebook Auth] Authentication successful:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        redirectTo,
      });

      return {
        message: user.role === UserRole.NONE ? 'User needs onboarding.' : 'User authenticated successfully.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        role: user.role,
        needsOnboarding: user.role === UserRole.NONE,
        redirectTo,
      };
    } catch (error) {
      // Log the full error for debugging
      console.error('[Facebook Auth] Unhandled error:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data,
        status: error?.response?.status,
      });

      if (error instanceof HttpException) {
        throw error;
      }
      
      // Provide a more detailed error message
      const errorMessage = error?.message || 'Unknown error occurred during Facebook authentication.';
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `Error authenticating with Facebook: ${errorMessage}`,
          details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  // Authenticate user with Facebook OAuth callback (Server-side OAuth flow)
  async authenticateWithFacebookCallback(
    facebookCallbackDto: FacebookCallbackDtoRequest,
  ): Promise<FacebookCallbackDtoResponse> {
    try {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      const frontendUrl = process.env.FRONT_URL || 'https://leftover.ccdev.space';
      const redirectUri = `${frontendUrl}/auth/callback`;

      if (!appId || !appSecret) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Facebook OAuth is not configured on the server.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Step 1: Exchange OAuth code for access token
      let accessToken: string;
      try {
        const tokenResponse = await axios.get(
          `https://graph.facebook.com/v24.0/oauth/access_token`,
          {
            params: {
              client_id: appId,
              client_secret: appSecret,
              redirect_uri: redirectUri,
              code: facebookCallbackDto.code,
            },
          },
        );

        if (!tokenResponse.data || !tokenResponse.data.access_token) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: 'Failed to exchange OAuth code for access token.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        accessToken = tokenResponse.data.access_token;
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        if (error.response?.status === 400) {
          const errorData = error.response.data;
          const errorMessage = errorData?.error?.message || 'Invalid OAuth code.';
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: errorMessage,
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error exchanging OAuth code for access token.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Step 2: Verify token and get user info from Facebook Graph API
      let userInfo;
      try {
        // Get user info
        const response = await axios.get(
          `https://graph.facebook.com/me`,
          {
            params: {
              access_token: accessToken,
              fields: 'id,name,email,picture',
            },
          },
        );

        userInfo = response.data;

        // Verify that the token belongs to our app
        const debugResponse = await axios.get(
          `https://graph.facebook.com/debug_token`,
          {
            params: {
              input_token: accessToken,
              access_token: `${appId}|${appSecret}`,
            },
          },
        );

        const tokenData = debugResponse.data.data;
        if (!tokenData || tokenData.app_id !== appId) {
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: 'Invalid Facebook access token or token does not belong to this app.',
            },
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (!tokenData.is_valid) {
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: 'Facebook access token is not valid.',
            },
            HttpStatus.UNAUTHORIZED,
          );
        }
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        if (error.response?.status === 401 || error.response?.status === 400) {
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: 'Invalid Facebook access token.',
            },
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error verifying Facebook token.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Step 3: Extract user information
      if (!userInfo || !userInfo.email) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Unable to extract user information from Facebook token. Email permission is required.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const email = userInfo.email;
      const name = userInfo.name || email.split('@')[0];
      // Extract profile image URL from Facebook response
      // Facebook Graph API returns picture in format: { picture: { data: { url: "..." } } }
      let picture = userInfo.picture?.data?.url || userInfo.picture?.url || null;

      // Step 4: Check if user exists
      let user = await this.prisma.user.findFirst({
        where: {
          email: email,
        },
      });

      // Step 5: Create user if doesn't exist
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: email,
            username: name,
            role: UserRole.NONE,
            profileImage: picture,
          },
        });
      } else {
        // Update profile image if it's not set and Facebook provides one
        if (!user.profileImage && picture) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { profileImage: picture },
          });
        }
        // Update username if it changed on Facebook
        if (user.username !== name) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { username: name },
          });
        }
      }

      // Step 6: Generate tokens
      const jwtAccessToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.NormalToken,
      );

      const refreshToken = await generateToken(
        user.id.toString(),
        user.email,
        JwtType.RefreshToken,
      );

      // Step 7: Determine redirect path based on role
      let redirectTo = '/onboarding';
      if (user.role === UserRole.PROVIDER) {
        redirectTo = '/provider/home';
      } else if (user.role === UserRole.PENDING_PROVIDER) {
        redirectTo = '/onboarding/thank-you';
      } else if (user.role === UserRole.CLIENT) {
        redirectTo = '/client/home';
      }

      return {
        message: user.role === UserRole.NONE ? 'User needs onboarding.' : 'User authenticated successfully.',
        accessToken: jwtAccessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        role: user.role,
        needsOnboarding: user.role === UserRole.NONE,
        redirectTo,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'Error authenticating with Facebook OAuth callback.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }
}
