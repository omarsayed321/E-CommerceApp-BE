import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { IsMatch } from 'src/common/decorator/match.custom.decorator';

export class SignupBodyDto {
  @Length(2, 60)
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({ minUppercase: 1 })
  password: string;

  @ValidateIf((data:SignupBodyDto) => {
    return Boolean(data.password)
  })
  @IsMatch<string>(['password'])
  confirmPassword: string;
}

export class SendEmailDto {
  @IsEmail()
  email: string;
}

export class LoginBodyDto extends SendEmailDto {
  @IsStrongPassword({ minUppercase: 1 })
  password: string;
}

export class ConfirmEmailDto extends SendEmailDto{
  @Matches(/^\d{6}$/)
  otp: string;
}

export class ConfirmResetPasswordDto extends ConfirmEmailDto{
  @IsStrongPassword({ minUppercase: 1 })
  password: string;
}

  
  export class SignupWithGmailDto {
    @IsString()
    idToken: string;
  }