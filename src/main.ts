import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import path from 'path';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);

  app.use("/uploads", express.static(path.resolve("./uploads")));

  await app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}
bootstrap();
