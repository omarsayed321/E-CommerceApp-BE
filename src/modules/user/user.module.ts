import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Module } from "@nestjs/common";

import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UserRepository } from 'src/DB/repository/user.repository';
import { UserModel } from 'src/DB/models/user.model';

import { S3Service } from './../../common/services/s3.service';

@Module({
    imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    UserModel,
  ],
    controllers:[UserController],
    providers:[UserService, UserRepository,S3Service],
    exports:[],
})
export class UserModule {}

