import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CartDocument } from 'src/DB/models/cart.model';
import { CartResponse } from './entities/cart.entity';

import { CreateCartDto } from './dto/create-cart.dto';
import { RemoveItemsFromCartDto, UpdateCartDto } from './dto/update-cart.dto';

import { RoleEnum } from 'src/common/enums/user.enum';
import { Auth } from 'src/common/decorator/auth.decorator';

import type { UserDocument } from 'src/DB/models/user.model';
import { User } from 'src/common/decorator/credential.decorator';

import { successResponse } from 'src/common/utils/response';
import { IResponse } from 'src/common/interfaces/response.interface';
import type { Response } from 'express';

@Auth([RoleEnum.user])
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async create(
    @User() user: UserDocument,
    @Body() createCartDto: CreateCartDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IResponse<CartResponse>> {
    const { cart, status } = await this.cartService.create(createCartDto, user);
    res.status(status);
    return successResponse<CartResponse>({ status, data: { cart } });
  }

  @Patch('remove-from-cart')
  async removeFromCart(
    @User() user: UserDocument,
    @Body() removeItemsFromCartDto: RemoveItemsFromCartDto,
  ): Promise<IResponse<CartResponse>> {
    const cart = await this.cartService.removeFromCart(
      removeItemsFromCartDto,
      user,
    );
    return successResponse<CartResponse>({ data: { cart } });
  }

  @Delete()
  async clearCart(@User() user: UserDocument): Promise<IResponse> {
    const cart = await this.cartService.clearCart(user);
    return successResponse();
  }

  @Get()
  async findOneCart(
    @User() user: UserDocument,
  ): Promise<IResponse<CartResponse>> {
    const cart = await this.cartService.findOneCart(user);
    return successResponse<CartResponse>({ data: { cart } });
  }
}
