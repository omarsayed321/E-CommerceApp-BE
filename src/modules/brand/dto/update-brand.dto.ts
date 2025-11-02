import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { containField } from 'src/common/decorator/update.decorator';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

@containField()
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class BrandParamsDto {
  @IsMongoId()
  brandId: Types.ObjectId
}
