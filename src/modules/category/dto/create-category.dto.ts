import { ICategory } from 'src/common/interfaces/category.interface';
import {MaxLength, MinLength, IsString, IsOptional, Validate} from 'class-validator';
import { Types } from 'mongoose';
import { MongoDBIds } from 'src/common/decorator/match.custom.decorator';

export class CreateCategoryDto implements Partial<ICategory> {
  @MaxLength(25)
  @MinLength(2)
  @IsString()
  name:string;
  
  @MaxLength(5000)
  @MinLength(2)
  @IsString()
  @IsOptional()
  description:string;

  @Validate(MongoDBIds)
  @IsOptional()
  brands: Types.ObjectId[];
}
