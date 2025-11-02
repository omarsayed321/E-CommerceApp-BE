import { Module } from '@nestjs/common';

import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandRepository } from 'src/DB/repository/brand.repository';
import { BrandModel } from 'src/DB/models/brand.model';

import { S3Service } from './../../common/services/s3.service';

@Module({
  imports: [BrandModel],
  controllers: [BrandController], 
  providers: [BrandService, BrandRepository, S3Service],
})
export class BrandModule {}
