import { Global, Module } from '@nestjs/common';

import { UserModel } from 'src/DB/models/user.model';
import { UserRepository } from 'src/DB/repository/user.repository';

import { JwtService } from '@nestjs/jwt';

import { TokenModel } from 'src/DB/models/token.model';
import { TokenService } from 'src/common/utils/security/token.security';
import { TokenRepository } from 'src/DB/repository/token.repository';

@Global()
@Module({
  imports: [UserModel, TokenModel],
  controllers: [],
  providers: [
    UserRepository,
    TokenService,
    TokenRepository,
    JwtService,
  ],
  exports: [
    UserRepository,
    TokenService,
    TokenRepository,
    JwtService,
    TokenModel,
    UserModel,
  ],
})
export class SharedAuthenticationModule {}
