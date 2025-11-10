import { Module } from '@nestjs/common';

import { ProductRepository } from './../../DB/repository/product.repository';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductModel } from './../../DB/models/product.model';

import { CategoryRepository } from 'src/DB/repository/category.repository';
import { CategoryModel } from 'src/DB/models/category.model';

import { BrandRepository } from 'src/DB/repository/brand.repository';
import { BrandModel } from 'src/DB/models/brand.model';

import { UserRepository } from 'src/DB/repository/user.repository';

import { S3Service } from './../../common/services/s3.service';

@Module({
  imports: [ProductModel, CategoryModel, BrandModel],
  controllers: [ProductController], 
  providers: [ProductService, ProductRepository, BrandRepository, UserRepository,S3Service, CategoryRepository],
})
export class ProductModule {}
