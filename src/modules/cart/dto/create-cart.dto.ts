import { IsMongoId, IsNumber, IsPositive, Min } from "class-validator";
import { Types } from "mongoose";
import { ICartProduct } from "src/common/interfaces/cart.interface";

export class CreateCartDto implements Partial<ICartProduct>{

  @IsMongoId()
  productId: Types.ObjectId;

  @Min(1)
  @IsNumber()
  @IsPositive()
  quantity: number;
}
