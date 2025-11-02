import type { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserDocument } from 'src/DB/models/user.model';
import { TokenEnum } from 'src/common/enums/token.enum';
import { IUser } from './user.interface';

export interface IToken {
  _id?: Types.ObjectId;

  createdBy: Types.ObjectId | IUser;

  jti: string;

  expiredAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICredentials {
  user: UserDocument;
  decoded: JwtPayload;
}

export interface IAuthRequest extends Request {
  credentials: ICredentials;
  tokenType?: TokenEnum;
}
