import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ICart, ICartProduct } from '../../common/interfaces/cart.interface';

@Schema({ timestamps: true, strictQuery: true })
export class CartProduct implements ICartProduct {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type:Number, required: true })
  quantity: number;

}

@Schema({ timestamps: true, strictQuery: true })
export class Cart implements ICart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  createdBy: Types.ObjectId;

  @Prop([CartProduct])
  products: CartProduct[];

}

export type CartProductDocument = HydratedDocument<CartProduct>;
export type CartDocument = HydratedDocument<Cart>;
const cartSchema = SchemaFactory.createForClass(Cart);

export const CartModel = MongooseModule.forFeature([
  { name: Cart.name, schema: cartSchema },
]);
