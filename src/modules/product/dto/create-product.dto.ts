import { IProduct } from 'src/common/interfaces/product.interface';
import {
  MaxLength,
  MinLength,
  IsString,
  IsOptional,
  IsMongoId,
  IsPositive,
  IsNumber,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreateProductDto implements Partial<IProduct> {
  @MaxLength(2000)
  @MinLength(2)
  @IsString()
  name: string;

  @MaxLength(50000)
  @MinLength(2)
  @IsString()
  @IsOptional()
  description: string;

  @IsMongoId()
  brand: Types.ObjectId;
  @IsMongoId()
  category?: Types.ObjectId;

  @Type(()=> Number)
  @IsPositive()
  @IsNumber()
  @IsOptional()
  discountPercent?: number;
  @Type(()=> Number)
  @IsPositive()
  @IsNumber()
  originalPrice: number;

  @Type(()=> Number)
  @IsPositive()
  @IsNumber()
  stock: number;
}
