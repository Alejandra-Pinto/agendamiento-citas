/* eslint-disable @typescript-eslint/no-unsafe-call */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ACTIVAR VALIDACIÓN GLOBAL PARA TODOS LOS DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // convierte JSON → DTO real
      whitelist: true, // elimina campos que no están en el DTO
      forbidNonWhitelisted: true, // lanza error si mandan campos extra
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.use((req, res, next) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,PATCH,POST,PUT,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('API Piedra Azul')
    .setDescription('API para gestión de citas médicas')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
