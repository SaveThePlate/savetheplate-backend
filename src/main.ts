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
//     origin: process.env.FRONT_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   });

//   // Content Security Policy (CSP) header - tighten script-src by default.
//   // If you need to allow string evaluation temporarily for debugging, set
//   // the env var ALLOW_UNSAFE_EVAL=true (NOT recommended for production).
//   app.use((req, res, next) => {
//     try {
//       const allowUnsafeEval = process.env.ALLOW_UNSAFE_EVAL === 'true';
//       const frontend = process.env.FRONT_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
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
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  // Enable CORS for the frontend and allow credentials
  // For staging/development, allow all ccdev.space origins
  // For production, use specific allowed origins
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Always allow localhost for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
      
      // Always allow all ccdev.space domains (staging environment)
      if (origin.includes('.ccdev.space')) {
        callback(null, true);
        return;
      }
      
      // For other origins, check against allowed list
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.NEXT_PUBLIC_FRONTEND_URL,
        'https://leftover.ccdev.space',
        'https://savetheplate.ccdev.space',
      ].filter(Boolean) as string[];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      
      // In production, reject unknown origins
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'), false);
        return;
      }
      
      // In development/staging, allow all
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(3001);
}
bootstrap();
