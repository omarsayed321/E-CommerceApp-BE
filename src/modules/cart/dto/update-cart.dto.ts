import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { Validate } from 'class-validator';
import { MongoDBIds } from 'src/common/decorator/match.custom.decorator';
import { Types } from 'mongoose';

export class UpdateCartDto extends PartialType(CreateCartDto) {}

export class RemoveItemsFromCartDto {
  @Validate(MongoDBIds)
  productIds: Types.ObjectId[];
}
