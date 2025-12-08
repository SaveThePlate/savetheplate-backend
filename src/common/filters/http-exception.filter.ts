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
        this.logger.error('Request or response is undefined in exception filter', exception);
        return;
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

      const errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url || 'unknown',
        method: request.method || 'unknown',
        message: typeof message === 'string' ? message : (message as any).message || message,
        error: exception instanceof Error ? exception.stack : undefined,
      };

      // Set CORS headers on error responses
      try {
        const origin = request.headers?.origin;
        if (origin && (origin.includes('.ccdev.space') || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
          response.setHeader('Access-Control-Allow-Origin', origin);
          response.setHeader('Access-Control-Allow-Credentials', 'true');
          response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With, Origin');
        }
      } catch (corsError) {
        // Silently ignore CORS header errors
      }

      // Log the error
      this.logger.error(
        `${request.method || 'unknown'} ${request.url || 'unknown'}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );

      // Ensure response has the necessary methods before calling them
      if (typeof response.status === 'function' && typeof response.json === 'function') {
        response.status(status).json(errorResponse);
      } else {
        this.logger.error('Response object does not have required methods (status/json)');
      }
    } catch (filterError) {
      // If the exception filter itself fails, log it but don't crash
      this.logger.error('Exception filter error:', filterError);
      this.logger.error('Original exception:', exception);
    }
  }
}

