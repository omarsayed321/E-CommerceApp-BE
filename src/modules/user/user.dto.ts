import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class UserParamsDto {
  @IsMongoId()
  userId: Types.ObjectId
}