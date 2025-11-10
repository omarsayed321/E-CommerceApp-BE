import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { RemoveItemsFromCartDto, UpdateCartDto } from './dto/update-cart.dto';

import { ProductRepository } from 'src/DB/repository/product.repository';

import { CartRepository } from 'src/DB/repository/cart.repository';
import { UserDocument } from 'src/DB/models/user.model';
import { CartDocument } from 'src/DB/models/cart.model';

@Injectable()
export class CartService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cartRepository: CartRepository,
  ) {}

  async create(
    createCartDto: CreateCartDto,
    user: UserDocument,
  ): Promise<{ status: number; cart: CartDocument }> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: createCartDto.productId,
        stock: { $gte: createCartDto.quantity },
      },
    });
    if (!product) {
      throw new NotFoundException('product not found or insufficient stock');
    }

    const cart = await this.cartRepository.findOne({
      filter: { createdBy: user._id },
    });
    if (!cart) {
      const [newCart] = await this.cartRepository.create({
        data: [
          {
            createdBy: user._id,
            products: [
              {
                productId: product._id,
                quantity: createCartDto.quantity,
              },
            ],
          },
        ],
      });
      if (!newCart) {
        throw new NotFoundException('failed to create cart');
      }
      return { status: 201, cart: newCart };
    }

    const checkProductInCart = cart.products.find((product) => {
      return product.productId == createCartDto.productId;
    });
    if (checkProductInCart) {
      checkProductInCart.quantity = createCartDto.quantity;
    } else {
      cart.products.push({
        productId: product._id,
        quantity: createCartDto.quantity,
      });
    }

    await cart.save();

    return { status: 200, cart: cart as CartDocument };
  }

  async removeFromCart(
    removeItemsFromCartDto: RemoveItemsFromCartDto,
    user: UserDocument,
  ): Promise<CartDocument> {
    const cart = await this.cartRepository.findOneAndUpdate({
      filter: { createdBy: user._id },
      update: {
        $pull: {
          products: { _id: { $in: removeItemsFromCartDto.productIds } },
        },
      },
    });
    if (!cart) {
      throw new NotFoundException('failed to find cart');
    }

    return cart as CartDocument;
  }

  async clearCart(user: UserDocument): Promise<string> {
    const cart = await this.cartRepository.deleteOne({
      filter: { createdBy: user._id },
    });
    if (!cart.deletedCount) {
      throw new NotFoundException('failed to find cart');
    }
    return 'Done';
  }

  async findOneCart(user: UserDocument): Promise<CartDocument> {
    const cart = await this.cartRepository.findOne({
      filter: { createdBy: user._id },
      options: { populate: [{ path: 'products.productId' }] },
    });
    if (!cart) {
      throw new NotFoundException('failed to find cart');
    }
    return cart as CartDocument;
  }
}
