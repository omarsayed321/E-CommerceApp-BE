import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';

import { randomUUID } from 'crypto';

import { UserDocument } from 'src/DB/models/user.model';
import { UserRepository } from 'src/DB/repository/user.repository';

import { RoleEnum } from 'src/common/enums/user.enum';
import { SignatureLevelEnum, TokenEnum } from 'src/common/enums/token.enum';

import { TokenRepository } from 'src/DB/repository/token.repository';
import { TokenDocument } from 'src/DB/models/token.model';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
  ) {}
  generateToken = async ({
    payload,
    options = {
      secret: process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    },
  }: {
    payload: object;
    options: JwtSignOptions;
  }): Promise<string> => {
    return await this.jwtService.signAsync(payload, options);
  };

  verifyToken = async ({
    token,
    options = {
      secret: process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    },
  }: {
    token: string;
    options: JwtVerifyOptions;
  }): Promise<JwtPayload> => {
    return (await this.jwtService.verifyAsync(
      token,
      options,
    )) as unknown as JwtPayload;
  };

  detectSignatureLevel = async (
    role: RoleEnum = RoleEnum.user,
  ): Promise<SignatureLevelEnum> => {
    let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer;
    switch (role) {
      case RoleEnum.admin:
      case RoleEnum.superAdmin:
        signatureLevel = SignatureLevelEnum.System;
        break;

      default:
        signatureLevel = SignatureLevelEnum.Bearer;
        break;
    }
    return signatureLevel;
  };

  getSignatures = async (
    signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer,
  ): Promise<{ access_signature: string; refresh_signature: string }> => {
    let signatures: { access_signature: string; refresh_signature: string } = {
      access_signature: '',
      refresh_signature: '',
    };
    switch (signatureLevel) {
      case SignatureLevelEnum.System:
        signatures.access_signature = process.env
          .ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
        signatures.refresh_signature = process.env
          .REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
        break;

      default:
        signatures.access_signature = process.env
          .ACCESS_USER_TOKEN_SIGNATURE as string;
        signatures.refresh_signature = process.env
          .REFRESH_USER_TOKEN_SIGNATURE as string;
        break;
    }
    return signatures;
  };

  createLoginCredentials = async (user: UserDocument) => {
    const signatureLevel = await this.detectSignatureLevel(user.role);
    const signatures = await this.getSignatures(signatureLevel);
    const jwtid = randomUUID();

    const access_token = await this.generateToken({
      payload: { id: user._id },
      options: {
        secret: signatures.access_signature,
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
        jwtid,
      },
    });

    const refresh_token = await this.generateToken({
      payload: { id: user._id },
      options: {
        secret: signatures.refresh_signature,
        expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        jwtid,
      },
    });

    return { access_token, refresh_token };
  };

  decodedToken = async ({
    authorization,
    tokenType = TokenEnum.access,
  }: {
    authorization: string;
    tokenType?: TokenEnum;
  }) => {
    try {
      const [bearerKey, token] = authorization.split(' ');

      if (!token || !bearerKey) {
        throw new UnauthorizedException('Missing or malformed token');
      }

      const signatures = await this.getSignatures(
        bearerKey as SignatureLevelEnum,
      );
      const decoded = await this.verifyToken({
        token,
        options: {
          secret:
            tokenType === TokenEnum.refresh
              ? signatures.refresh_signature
              : signatures.access_signature,
        },
      });

      // accept either `sub` (standard) or `id` (used when creating token)
      const subject = (decoded as any).sub || (decoded as any).id;
      if (!subject || !decoded?.iat) {
        throw new BadRequestException('Invalid token payload');
      }

      if (await this.tokenRepository.findOne({ filter: { jti: decoded.jti } })) {
        throw new UnauthorizedException('Token Expired');
      }

      const user = (await this.userRepository.findOne({
        filter: { _id: subject },
      })) as UserDocument;
      if (!user) {
        throw new BadRequestException('Not Registered Account');
      }

      if ((user.changeCredentialsTime?.getTime() || 0) > (decoded.iat as number) * 1000) {
        throw new UnauthorizedException('Token Expired');
      }

      return { user, decoded };
    } catch (error) {
      // rethrow known HTTP exceptions to preserve correct status codes
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        (error && (error as Error).message) || 'something went wrong!',
      );
    }
  };

  createRevokeToken = async (decoded: JwtPayload): Promise<TokenDocument> => {
    const [result] =
      (await this.tokenRepository.create({
        data: [
          {
            jti: decoded.jti as string,
            expiredAt: new Date(
              (decoded.iat as number) +
                Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            ),
            createdBy: Types.ObjectId.createFromHexString(
              decoded.sub as string,
            ),
          },
        ],
      })) || [];

    if (!result) {
      throw new BadRequestException('Token Revocation Failed');
    }
    return result;
  };
}
