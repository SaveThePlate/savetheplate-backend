// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { join } from 'path';
// import { NestExpressApplication } from '@nestjs/platform-express';
// import * as http from 'http';
// async function bootstrap() {
//   const app = await NestFactory.create<NestExpressApplication>(AppModule);;

//   const config = new DocumentBuilder()
//     .setTitle('Cats example')
//     .setDescription('The cats API description')
//     .setVersion('1.0')
//     .addTag('cats')
//     .build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, document);

//   app.useStaticAssets(join(__dirname, '..', 'uploads'));

//   // Enable CORS for the frontend and allow credentials so the browser
//   // will accept Set-Cookie from the backend during the auth callback.
//   // Make sure FRONT_URL is set to your frontend's origin (including protocol).
//   app.enableCors({
//     origin: process.env.FRONT_URL || 'http://localhost:3000',
//     credentials: true,
//   });

//   // Content Security Policy (CSP) header - tighten script-src by default.
//   // If you need to allow string evaluation temporarily for debugging, set
//   // the env var ALLOW_UNSAFE_EVAL=true (NOT recommended for production).
//   app.use((req, res, next) => {
//     try {
//       const allowUnsafeEval = process.env.ALLOW_UNSAFE_EVAL === 'true';
//       const frontend = process.env.FRONT_URL || '';
//       const scriptSrcParts = ["'self'"];
//       if (allowUnsafeEval) scriptSrcParts.push("'unsafe-eval'");
//       // You can add trusted CDNs here when needed, e.g. scriptSrcParts.push('https://www.googletagmanager.com')
//       const scriptSrc = scriptSrcParts.join(' ');

//       const csp = [
//         `default-src 'self'`,
//         `script-src ${scriptSrc}`,
//         `style-src 'self' 'unsafe-inline'`,
//         `img-src 'self' data:`,
//         `connect-src 'self' ${frontend}`,
//         `font-src 'self'`,
//         // Report violations to /csp-report for debugging (remove or change in prod)
//         `report-uri /csp-report`,
//       ].join('; ');

//       res.setHeader('Content-Security-Policy', csp);
//     } catch (e) {
//       // ignore header errors
//     }
//     next();
//   });

//   // Minimal CSP report endpoint to collect violation reports during debugging.
//   // The browser will POST JSON reports to this path when report-uri is set.
//   app.use((req, res, next) => {
//     if (req.method === 'POST' && req.url === '/csp-report') {
//       let body = '';
//       req.on('data', (chunk) => (body += chunk));
//       req.on('end', () => {
//         try {
//           const parsed = body ? JSON.parse(body) : body;
//           // Log CSP report to server console for triage
//           console.warn('CSP Violation Report:', JSON.stringify(parsed, null, 2));
//         } catch (err) {
//           console.warn('CSP Violation Report (raw):', body);
//         }
//         res.statusCode = 204;
//         return res.end();
//       });
//       return;
//     }
//     return next();
//   });

//   await app.listen(3001);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { Logger, ValidationPipe, HttpStatus, HttpException } from '@nestjs/common';
import { loadEnvFromFiles } from './utils/env-loader';
import { isOriginAllowed } from './utils/cors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Ensure process.env is populated in a predictable way for local vs production.
    // In production, hosting-provided env vars always win; env files only fill in missing keys.
    loadEnvFromFiles();

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Trust proxy - important for production deployments behind reverse proxy (Nginx, etc.)
    // This allows Express to trust X-Forwarded-* headers from the proxy
    app.set('trust proxy', true);

    // Add Express middleware to immediately return 404 for frontend static files
    // This MUST run before NestJS routing to prevent validation errors
    // Use getHttpAdapter() to access the underlying Express instance directly
    const expressApp = app.getHttpAdapter().getInstance();
    
    expressApp.use((req, res, next) => {
      const url = req.url || req.path || '';
      
      // List of frontend routes that should return 404 immediately
      const frontendStaticRoutes = [
        '/_next/',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/manifest.json',
        '/sw.js', // Service worker
        '/workbox-', // Workbox files
      ];
      
      // Check if this is a frontend static file request
      const isFrontendStatic = frontendStaticRoutes.some(route => 
        url.startsWith(route) || url === route
      );
      
      if (isFrontendStatic) {
        // Return 404 immediately without any processing
        // Set proper headers to prevent caching of error responses
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Content-Type', 'application/json');
        return res.status(404).json({
          statusCode: 404,
          message: 'Not Found - This is a frontend route and should not reach the backend API',
        });
      }
      
      next();
    });

    // Add global exception filter to catch all errors
    app.useGlobalFilters(new AllExceptionsFilter());

    // Enable global validation pipe for DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: false, // Don't throw error if non-whitelisted properties are present (more lenient)
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable implicit type conversion
        },
        exceptionFactory: (errors) => {
          // Format validation errors to be more readable
          const messages = errors.map((error) => {
            const constraints = error.constraints || {};
            return Object.values(constraints).join(', ');
          });
          return new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              message: messages.length === 1 ? messages[0] : messages,
              error: 'Validation failed',
            },
            HttpStatus.BAD_REQUEST,
          );
        },
      }),
    );

    // Swagger configuration - only enable in development or with authentication
    const enableSwagger = process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV !== 'production';
    
    if (enableSwagger) {
      const config = new DocumentBuilder()
        .setTitle('Save The Plate API')
        .setDescription('Save The Plate API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      
      // Protect Swagger with basic auth in production
      if (process.env.NODE_ENV === 'production') {
        // Use a custom middleware to protect Swagger
        app.use('/api', (req, res, next) => {
          const swaggerUser = process.env.SWAGGER_USER;
          const swaggerPass = process.env.SWAGGER_PASSWORD;
          
          if (!swaggerUser || !swaggerPass) {
            return res.status(503).send('Swagger authentication not configured');
          }
          
          const auth = req.headers.authorization;
          if (!auth || !auth.startsWith('Basic ')) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Swagger API Documentation"');
            return res.status(401).send('Authentication required');
          }
          
          const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
          const [username, password] = credentials.split(':');
          
          if (username === swaggerUser && password === swaggerPass) {
            return next();
          }
          
          res.setHeader('WWW-Authenticate', 'Basic realm="Swagger API Documentation"');
          return res.status(401).send('Invalid credentials');
        });
      }
      
      SwaggerModule.setup('api', app, document);
    }

    app.useStaticAssets(join(__dirname, '..', 'uploads'));

    // CORS: centralized origin allowlist (utils/cors.ts)
    app.enableCors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Cache-Control',
        'cache-control',
        'X-Requested-With',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
      ],
      exposedHeaders: [
        'Content-Type',
        'Authorization',
        'Access-Control-Allow-Origin',
      ],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400, // 24 hours
    });

    // Add a middleware to ensure CORS headers are set even on error responses
    // This runs AFTER CORS middleware to add headers to error responses
    app.use((req, res, next) => {
      // Guard against undefined req or res objects
      if (!req || !res) {
        return next();
      }

      try {
        const origin = req.headers?.origin;

        // Set CORS headers for all responses (as a fallback)
        // The main CORS middleware should handle this, but this ensures it's set on errors
        if (
          origin &&
          (origin.includes('savetheplate.tn') ||
            origin.includes('.ccdev.space') ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:'))
        ) {
          // Only set if not already set by CORS middleware
          if (!res.getHeader('Access-Control-Allow-Origin')) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader(
              'Access-Control-Allow-Methods',
              'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
            );
            res.setHeader(
              'Access-Control-Allow-Headers',
              'Content-Type, Authorization, Accept, Cache-Control, cache-control, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
            );
          }
        }
      } catch (error) {
        // Silently ignore errors in CORS header setting to prevent crashes
        // The main CORS middleware should handle this anyway
      }

      // Don't handle OPTIONS here - let CORS middleware handle it
      next();
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('❌ Error starting the application:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
