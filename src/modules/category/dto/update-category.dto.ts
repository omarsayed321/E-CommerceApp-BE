import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { containField } from 'src/common/decorator/update.decorator';
import { IsMongoId,IsOptional, Validate } from 'class-validator';
import { Types } from 'mongoose';
import { MongoDBIds } from 'src/common/decorator/match.custom.decorator';

@containField()
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @Validate(MongoDBIds)
  @IsOptional()
  removeBrands?: Types.ObjectId[]
}

export class CategoryParamsDto {
  @IsMongoId()
  categoryId: Types.ObjectId
}

