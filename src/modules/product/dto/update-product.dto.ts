import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { containField } from 'src/common/decorator/update.decorator';
import { IsArray, IsMongoId, IsOptional} from 'class-validator';
import { Types } from 'mongoose';

@containField()
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class UpdateProductAttachmentDto {
  @IsArray()
  @IsOptional()
  removedAttachments?: string[];
}

export class ProductParamsDto {
  @IsMongoId()
  productId: Types.ObjectId
}


