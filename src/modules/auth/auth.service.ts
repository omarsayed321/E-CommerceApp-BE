import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from 'src/DB/repository/user.repository';

import { OtpRepository } from './../../DB/repository/otp.repository';
import { OtpEnum } from 'src/common/enums/otp.enum';
import { generateOtpNumber } from './../../common/utils/otp';

import { Types } from 'mongoose';

import {
  SendEmailDto,
  SignupBodyDto,
  ConfirmEmailDto,
  LoginBodyDto,
  SignupWithGmailDto,
  ConfirmResetPasswordDto,
} from './dto/auth.dto';

import {
  compareHash,
  generateHash,
} from 'src/common/utils/security/hash.security';
import { TokenService } from 'src/common/utils/security/token.security';

import { ProviderEnum } from 'src/common/enums/user.enum';

import { UserDocument } from 'src/DB/models/user.model';

import { OAuth2Client, type TokenPayload } from 'google-auth-library';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly tokenService: TokenService,
  ) {}

  private async createConfirmOtp(userId: Types.ObjectId, otpType: OtpEnum) {
    const [otp] = await this.otpRepository.create({
      data: [
        {
          otp: generateOtpNumber(),
          expiresAt: new Date(Date.now() + 2 * 60 * 1000),
          createdBy: userId,
          type: otpType,
        },
      ],
    });
  }

  private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID?.split(',') || [],
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException('failed to verify this google account');
    }
    return payload;
  }

  async signup(data: SignupBodyDto): Promise<string> {
    const { email, password, username } = data;
    const checkUser = await this.userRepository.findOne({
      filter: { email },
    });
    if (checkUser) {
      throw new ConflictException('User already exist');
    }
    const [user] = await this.userRepository.create({
      data: [{ username, email, password }],
    });
    if (!user) {
      throw new BadRequestException('failed to signup');
    }

    await this.createConfirmOtp(user._id, OtpEnum.confirmEmail);

    return ' user signup successfully ';
  }

  async loginWithGmail(
    data: SignupWithGmailDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { idToken } = data;
    const { email } = await this.verifyGmailAccount(idToken);
    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.google,
      },
    });
    if (!user) {
      throw new NotFoundException(
        'not registered account or registered with another provider',
      );
    }

    return await this.tokenService.createLoginCredentials(user as UserDocument);
  }

  async signupWithGmail(
    data: SignupWithGmailDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { idToken } = data;
    const { email, family_name, given_name, picture } =
      await this.verifyGmailAccount(idToken);
    const user = await this.userRepository.findOne({
      filter: { email },
    });
    if (user) {
      if (user.provider === ProviderEnum.google) {
        return await this.loginWithGmail(data);
      }
      throw new ConflictException('Email exist');
    }

    const [newUser] =
      (await this.userRepository.create({
        data: [
          {
            email: email as string,
            firstName: given_name as string,
            lastName: family_name as string,
            profilePicture: picture as string,
            confirmedAt: new Date(),
            provider: ProviderEnum.google,
          },
        ],
      })) || [];

    if (!newUser) {
      throw new BadRequestException('failed to create user with gmail');
    }

    return await this.tokenService.createLoginCredentials(
      newUser as UserDocument,
    );
  }

  async resendConfirmEmail(data: SendEmailDto): Promise<string> {
    const { email } = data;
    const user = await this.userRepository.findOne({
      filter: { email, confirmedAt: { $exists: false } },
      options: {
        populate: [
          {
            path: 'otp',
            match: { type: OtpEnum.confirmEmail },
          },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User does not exist or user is already confirmed',
      );
    }

    if (user.otp?.length) {
      throw new ConflictException(
        `we can not send you otp until the existing one expires please try again after ${user.otp[0].expiresAt}`,
      );
    }

    await this.createConfirmOtp(user._id, OtpEnum.confirmEmail);

    return ' done ';
  }

  async confirmEmail(data: ConfirmEmailDto): Promise<string> {
    const { email, otp } = data;
    const user = await this.userRepository.findOne({
      filter: { email, confirmedAt: { $exists: false } },
      options: {
        populate: [
          {
            path: 'otp',
            match: { type: OtpEnum.confirmEmail },
          },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User does not exist or user is already confirmed',
      );
    }

    if (!(user.otp?.length && (await compareHash(otp, user.otp[0].otp)))) {
      throw new BadRequestException('invalid otp');
    }

    user.confirmedAt = new Date();
    await user.save();
    await this.otpRepository.deleteOne({ filter: { _id: user.otp[0]._id } });

    return ' user confirmed successfully ';
  }

  async login(
    data: LoginBodyDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = data;
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: true },
        provider: ProviderEnum.system,
      },
    });

    if (!user) {
      throw new NotFoundException('failed to find matching account or user is not confirmed');
    }

    if (!(await compareHash(password, user.password))) {
      throw new NotFoundException('failed to find matching account');
    }

    return await this.tokenService.createLoginCredentials(user as UserDocument);
  }

  async sendResetPasswordCode(data: SendEmailDto): Promise<string> {
    const { email } = data;
    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.system,
        confirmedAt: { $exists: true },
      },
      options: {
        populate: [
          {
            path: 'otp',
            match: { type: OtpEnum.resetPassword },
          },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User does not exist or user is not confirmed',
      );
    }

    if (user.otp?.length) {
      throw new ConflictException(
        `we can not send you otp until the existing one expires please try again after ${user.otp[0].expiresAt}`,
      );
    }

    const otp = await this.createConfirmOtp(user._id, OtpEnum.resetPassword);

    const result = await this.userRepository.updateOne({
      filter: { email },
      update: {
        resetPasswordOtp: await generateHash(String(otp)),
      },
    });

    if (!result.matchedCount) {
      throw new BadRequestException('failed to send code');
    }

    return ' code sent ';
  }

  async resetPassword(data: ConfirmResetPasswordDto): Promise<string> {
    const { email, otp, password } = data;

    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.system,
        resetPasswordOtp: { $exists: true },
      },
      options: {
        populate: [
          {
            path: 'otp',
            match: { type: OtpEnum.resetPassword },
          },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(' invalid account ');
    }

    if (!(user.otp?.length && (await compareHash(otp, user.otp[0].otp)))) {
      throw new BadRequestException('invalid otp');
    }

    const result = await this.userRepository.updateOne({
      filter: { email },
      update: {
        password: await generateHash(password),
        $set: { changeCredentialsTime: new Date() },
        $unset: { resetPasswordOtp: 1 },
      },
    });

    if (!result.matchedCount) {
      throw new BadRequestException('failed to reset password');
    }

    return ' password changed successfully ';
  }
}
