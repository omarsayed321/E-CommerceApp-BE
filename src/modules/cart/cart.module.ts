import { Module } from '@nestjs/common';

import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from 'src/DB/repository/cart.repository';
import { CartModel } from 'src/DB/models/cart.model';

import { ProductRepository } from 'src/DB/repository/product.repository';
import { ProductModel } from 'src/DB/models/product.model';

@Module({
  imports:[CartModel, ProductModel],
  controllers: [CartController],
  providers: [CartService, CartRepository, ProductRepository],
})
export class CartModule {}
