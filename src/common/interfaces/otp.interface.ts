import { Types } from 'mongoose';
import { OtpEnum } from 'src/common/enums/otp.enum';
import { IUser } from './user.interface';

export interface IOtp {
  _id?: Types.ObjectId;

  createdBy: Types.ObjectId | IUser;

  otp: string;

  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;

  type: OtpEnum;
}
