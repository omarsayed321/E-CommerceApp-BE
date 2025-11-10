import { CouponEnum } from './../enums/coupon.enum';
import { Types } from 'mongoose';
import { IUser } from './user.interface';

export interface ICoupon {
  _id?: Types.ObjectId;

  name: string;
  slug?: string;
  image: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  usedBy?: Types.ObjectId[] | IUser[];

  duration: number;
  discount:number;
  type:CouponEnum;
  startDate?: Date;
  endDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;

  freezedAt?: Date;
  restoredAt?: Date;

}
