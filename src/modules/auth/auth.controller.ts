import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';

import { SendEmailDto, SignupBodyDto, ConfirmEmailDto, LoginBodyDto, ConfirmResetPasswordDto, SignupWithGmailDto } from './dto/auth.dto';

import { AuthenticationService } from './auth.service';
import { successResponse } from './../../common/utils/response';
import { IResponse } from 'src/common/interfaces/response.interface';


@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('signup')
  async signup(
    @Body()
    body: SignupBodyDto,
  ): Promise<IResponse> {
    await this.authenticationService.signup(body);
    return successResponse({message: 'user signup successfully', status:201});
  }
  
  @Patch('confirm-email')
  async confirmEmail(
    @Body()
    body: ConfirmEmailDto,
  ): Promise<IResponse> {
    await this.authenticationService.confirmEmail(body);
    return successResponse({message: 'email confirmed successfully'});
  }

  @Post('resend-confirm-email')
  async resendConfirmEmail(
    @Body()
    body: SendEmailDto,
  ): Promise<IResponse> {
    await this.authenticationService.resendConfirmEmail(body);
    return successResponse({message: 'confirm email resent successfully'});
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body()
    body: LoginBodyDto,
  ): Promise<IResponse<{credentials: {access_token: string; refresh_token: string}}>> {
    const credentials = await this.authenticationService.login(body);
    return successResponse<{credentials: {access_token: string; refresh_token: string}}> ({message: 'user logged in successfully', data: {credentials}});
  }
  
  @Post('login-gmail')
  @HttpCode(HttpStatus.OK)
  async loginWithGmail(
    @Body()
    body: SignupWithGmailDto,
  ): Promise<IResponse<{credentials: {access_token: string; refresh_token: string}}>> {
    const credentials = await this.authenticationService.loginWithGmail(body);
    return successResponse<{credentials: {access_token: string; refresh_token: string}}> ({message: 'user logged in by gmail successfully', data: {credentials}});
  }
  
  @Post('signup-gmail')
  @HttpCode(HttpStatus.OK)
  async signupWithGmail(
    @Body()
    body: SignupWithGmailDto,
  ): Promise<IResponse<{credentials: {access_token: string; refresh_token: string}}>> {
    const credentials = await this.authenticationService.signupWithGmail(body);
    return successResponse<{credentials: {access_token: string; refresh_token: string}}> ({message: 'user signed up with gmail successfully', data: {credentials}});
  }
  
    @Patch('send-reset-password')
    async sendResetPasswordCode(
      @Body()
      body: SendEmailDto,
    ): Promise<IResponse> {
      await this.authenticationService.sendResetPasswordCode(body);
      return successResponse({message: 'reset password code sent successfully'});
    }
   
    @Patch('reset-password')
    async resetPassword(
      @Body()
      body: ConfirmResetPasswordDto,
    ): Promise<IResponse> {
      await this.authenticationService.resetPassword(body);
      return successResponse({message: 'password changed successfully'});
    }
}
