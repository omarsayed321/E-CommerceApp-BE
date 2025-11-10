import { Types } from 'mongoose';
import { IUser } from './user.interface';

export interface ICartProduct {
  _id?: Types.ObjectId;

  productId: Types.ObjectId;
  quantity: number;
  // price: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICart {
  _id?: Types.ObjectId;

  createdBy: Types.ObjectId | IUser;

  products: ICartProduct[];
  // totalPrice: number;

  createdAt?: Date;
  updatedAt?: Date;
}
