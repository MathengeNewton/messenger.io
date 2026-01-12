import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3010', // Frontend (dev)
      'http://localhost:3000', // Fallback (dev)
      'http://127.0.0.1:3010',
      'http://127.0.0.1:3000',
      'http://messenger.io', // Local domain
      'https://messenger.io', // Local domain (HTTPS)
      'http://messenger.jerdyl.co.ke', // Production frontend
      'https://messenger.jerdyl.co.ke', // Production frontend (HTTPS)
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Messenger.io API')
    .setDescription('API documentation for the Messenger.io platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 4500);
}

bootstrap();
