import { Global, Module } from '@nestjs/common';

import { OtpModel } from 'src/DB/models/otp.model';
import { AuthenticationController } from './auth.controller';
import { AuthenticationService } from './auth.service';
import { OtpRepository } from 'src/DB/repository/otp.repository';

@Global()
@Module({
  imports: [OtpModel],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, OtpRepository],
  exports: [],
})
export class AuthenticationModule {}
