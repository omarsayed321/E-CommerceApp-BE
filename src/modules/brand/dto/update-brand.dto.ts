import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { containField } from 'src/common/decorator/update.decorator';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

@containField()
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class BrandParamsDto {
  @IsMongoId()
  brandId: Types.ObjectId
}

export class GetAllBrandsDto {
  @Type(()=> Number)
  @IsPositive()
  @IsNumber()
  @IsOptional()
  page: number;
  
  @Type(()=> Number)
  @IsPositive()
  @IsNumber()
  @IsOptional()
  size: number;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  search: string;
}
