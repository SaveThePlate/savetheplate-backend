import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      // Guard against undefined request or response
      if (!request || !response) {
        this.logger.error(
          'Request or response is undefined in exception filter',
          exception,
        );
        return;
      }

      // Check if this is a frontend static file request - return 404 immediately
      const url = request.url || request.path || '';
      const frontendStaticRoutes = [
        '/_next/',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/manifest.json',
        '/sw.js',
        '/workbox-',
      ];
      
      const isFrontendStatic = frontendStaticRoutes.some(route => 
        url.startsWith(route) || url === route
      );
      
      if (isFrontendStatic) {
        // Return 404 for frontend static files, don't process as API error
        response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        response.setHeader('Content-Type', 'application/json');
        return response.status(404).json({
          statusCode: 404,
          message: 'Not Found - This is a frontend route and should not reach the backend API',
        });
      }

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        exception instanceof HttpException
          ? exception.getResponse()
          : exception instanceof Error
            ? exception.message
            : 'Internal server error';

      // Extract user-friendly message
      let userMessage: string;
      if (typeof message === 'string') {
        userMessage = message;
      } else if (message && typeof message === 'object') {
        // Handle NestJS HttpException response format
        const msgObj = message as any;
        userMessage = msgObj.message || msgObj.error || 'An error occurred';
      } else {
        userMessage = 'An error occurred';
      }

      // Don't expose technical details to users
      // Only include stack trace in development
      const errorResponse: any = {
        statusCode: status,
        message: userMessage,
      };

      // Only include technical details in development
      if (process.env.NODE_ENV === 'development') {
        errorResponse.timestamp = new Date().toISOString();
        errorResponse.path = request.url || 'unknown';
        errorResponse.method = request.method || 'unknown';
        errorResponse.error = exception instanceof Error ? exception.stack : undefined;
      }

      // Set CORS headers on error responses
      try {
        const origin = request.headers?.origin;
        if (
          origin &&
          (origin.includes('.ccdev.space') ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:'))
        ) {
          response.setHeader('Access-Control-Allow-Origin', origin);
          response.setHeader('Access-Control-Allow-Credentials', 'true');
          response.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
          );
          response.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With, Origin',
          );
        }
      } catch (corsError) {
        // Silently ignore CORS header errors
      }

      // List of frontend routes that should not be logged as errors
      // These are Next.js routes that shouldn't reach the backend API
      const frontendRoutes = [
        '/_next/',
        '/client/',
        '/provider/',
        '/signIn',
        '/signin',
        '/onboarding/',
        '/privacy',
        '/contact',
        '/impact',
        '/callback/',
        '/data-deletion',
        '/logo',
        '/favicon',
        '/robots.txt',
        '/sitemap.xml',
      ];

      const isFrontendRoute = frontendRoutes.some(route => 
        request.url?.startsWith(route) || request.url?.includes(route)
      );

      // Only log errors that are not 404s for frontend routes
      // This reduces log noise from misconfigured proxies or direct frontend requests
      const shouldLog = !(
        status === HttpStatus.NOT_FOUND && 
        isFrontendRoute
      );

      if (shouldLog) {
        // Log the error with more details for debugging
        const errorDetails = {
          method: request.method || 'unknown',
          url: request.url || 'unknown',
          path: request.path || 'unknown',
          query: request.query || {},
          body: request.body || {},
          headers: {
            origin: request.headers?.origin,
            'user-agent': request.headers?.['user-agent'],
            authorization: request.headers?.authorization ? 'Bearer ***' : undefined,
          },
          status,
          message: userMessage,
        };
        
        this.logger.error(
          `${request.method || 'unknown'} ${request.url || 'unknown'} - ${status} ${userMessage}`,
          JSON.stringify(errorDetails, null, 2),
        );
        
        // Also log stack trace for 400 errors to help debug validation issues
        if (status === HttpStatus.BAD_REQUEST && exception instanceof Error) {
          this.logger.debug('Bad Request Stack Trace:', exception.stack);
        }
      }

      // Ensure response has the necessary methods before calling them
      if (
        typeof response.status === 'function' &&
        typeof response.json === 'function'
      ) {
        response.status(status).json(errorResponse);
      } else {
        this.logger.error(
          'Response object does not have required methods (status/json)',
        );
      }
    } catch (filterError) {
      // If the exception filter itself fails, log it but don't crash
      this.logger.error('Exception filter error:', filterError);
      this.logger.error('Original exception:', exception);
    }
  }
}
