import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthenticationModule } from './modules/auth/auth.module';

import { UserModule } from './modules/user/user.module';

import { S3Service } from './common/services/s3.service';
import { SharedAuthenticationModule } from './common/modules/shared.auth.module';
import { BrandModule } from './modules/brand/brand.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('./config/.env.dev'),
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.DB_URI as string, {
      serverSelectionTimeoutMS: 30000,
    }),
    SharedAuthenticationModule,
    AuthenticationModule,
    UserModule,
    BrandModule,
    // CategoryModule,
    // ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
