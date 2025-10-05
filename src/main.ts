import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeedService } from './common/services/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('port');
  const swaggerEnabled = configService.get<boolean>('swagger.enabled');
  const swaggerPath = configService.get<string>('swagger.path');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      `http://localhost:${port + 1}`,
      `http://localhost:${port}`,
      `http://127.0.0.1:${port + 1}`,
      `http://127.0.0.1:${port}`,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger configuration
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Coffee House API')
      .setDescription('API for Coffee House application')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document);
  }

  const seedService = app.get(SeedService);
  await seedService.seedAll();

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(
      `📚 Swagger UI is available at: http://localhost:${port}/${swaggerPath}`,
    );
  }
}
bootstrap();
