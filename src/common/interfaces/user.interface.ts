import { Types } from 'mongoose';
import { RoleEnum, ProviderEnum } from 'src/common/enums/user.enum';
import { GenderEnum } from 'src/common/enums/user.enum';
import { OtpDocument } from 'src/DB/models/otp.model';
import { IProduct } from './product.interface';

export interface IUser {
  _id?: Types.ObjectId;

  firstName: string;
  lastName: string;
  username?: string;

  email: string;

  password?: string;
  resetPasswordOtp?: string;
  

  confirmedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  freezedAt?: Date;
  restoredAt?: Date;

  
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;


  profilePicture?: string;

  role: RoleEnum;
  provider: ProviderEnum;
  gender: GenderEnum;

  changeCredentialsTime?: Date;

  otp?: OtpDocument[];

  wishList?: Types.ObjectId[] | IProduct[];
}
