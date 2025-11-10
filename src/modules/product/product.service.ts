import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import {UpdateProductDto, UpdateProductAttachmentDto, } from './dto/update-product.dto';
import { SearchDto } from 'src/common/dtos/search.dto';

import { BrandRepository } from './../../DB/repository/brand.repository';
import { CategoryRepository } from './../../DB/repository/category.repository';
import { S3Service } from './../../common/services/s3.service';

import { ProductRepository } from './../../DB/repository/product.repository';
import { ProductDocument } from 'src/DB/models/product.model';

import { UserRepository } from './../../DB/repository/user.repository';
import { UserDocument } from 'src/DB/models/user.model';

import { FolderEnum } from 'src/common/enums/multer.enum';

import { randomUUID } from 'crypto';

import { Lean } from 'src/DB/repository/database.repository';
import { Types } from 'mongoose';
import { CategoryDocument } from 'src/DB/models/category.model.js';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    user: UserDocument,
  ) {
    const { name, description, discountPercent, originalPrice, stock } =
      createProductDto;

    const category = await this.categoryRepository.findOne({
      filter: { _id: createProductDto.category },
    });
    if (!category) {
      throw new NotFoundException('failed to find matching category');
    }

    const brand = await this.brandRepository.findOne({
      filter: { _id: createProductDto.brand },
    });
    if (!brand) {
      throw new NotFoundException('failed to find matching brand');
    }

    let assetFolderId: string = randomUUID();

    const images: string[] = await this.s3Service.uploadFiles({
      files,
      path: `${FolderEnum.Category}/${createProductDto.category}/${FolderEnum.Product}/${assetFolderId}`,
    });

    const [product] = await this.productRepository.create({
      data: [
        {
          category: category._id,
          brand: brand._id,
          assetFolderId,
          name,
          description,
          discountPercent,
          originalPrice,
          salePrice:
            originalPrice -
            ((discountPercent ? discountPercent : 0) / 100) * originalPrice,
          stock,
          images,
          createdBy: user._id,
        },
      ],
    });
    if (!product) {
      await this.s3Service.deleteFiles({ urls: images });
      throw new BadRequestException('failed to create this product ');
    }

    return product;
  }

  async findAll(
    data: SearchDto,
    archive: boolean = false,
  ): Promise<{
    docsCount?: number;
    limit?: number;
    pagesCount?: number;
    currentPage?: number | undefined;
    result: Array<ProductDocument | Lean<ProductDocument>>;
  }> {
    const { page, size, search } = data;
    const result = await this.productRepository.paginate({
      filter: {
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),

        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {}),
      },
      page,
      size,
    });

    return result;
  }

  async findOne(
    productId: Types.ObjectId,
    archive: boolean = false,
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {}),
      },
    });
    if (!product) {
      throw new NotFoundException('failed to find this product');
    }

    return product;
  }

  async findOneArchive(
    productId: Types.ObjectId,
    archive: boolean = false,
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {}),
      },
    });
    if (!product) {
      throw new NotFoundException('failed to find this product');
    }

    return product;
  }

  async update(
    productId: Types.ObjectId,
    updateProductDto: UpdateProductDto,
    user: UserDocument,
  ): Promise<ProductDocument | Lean<ProductDocument>> {

    const product = await this.productRepository.findOne({
      filter: { _id: productId },
    });
    if (!product) {
      throw new NotFoundException('failed to find this product');
    }

    if (updateProductDto.category) {
      const category = await this.categoryRepository.findOne({
        filter: { _id: updateProductDto.category },
      });
      if (!category) {
        throw new NotFoundException('failed to find matching category');
      }
      updateProductDto.category = category._id;
    }

    if (updateProductDto.brand) {
      const brand = await this.brandRepository.findOne({
        filter: { _id: updateProductDto.brand },
      });
      if (!brand) {
        throw new NotFoundException('failed to find matching brand');
      }
      updateProductDto.brand = brand._id;
    }

    let salePrice = product.salePrice;

    if(updateProductDto.originalPrice || updateProductDto.discountPercent){
      const originalPrice = updateProductDto.originalPrice ??  product.originalPrice;
      const discountPercent = updateProductDto.discountPercent ?? product.discountPercent;
      salePrice = originalPrice - ((discountPercent ? discountPercent : 0) / 100) * originalPrice;
    }

    const updatedProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: 
        {
          ...updateProductDto,
          salePrice,
          updatedBy: user._id,

        },
    });
    if (!updatedProduct) {
      throw new NotFoundException('Failed to update this category');
    }

    return updatedProduct;
  }

  async updateAttachment(
    productId: Types.ObjectId,
    updateProductAttachmentDto: UpdateProductAttachmentDto,
    user: UserDocument,
    files?: Express.Multer.File[],
  ): Promise<ProductDocument | Lean<ProductDocument>> {

    const product = await this.productRepository.findOne({
      filter: { _id: productId },
      options: {populate:[{path: "category"}]},
    });
    if (!product) {
      throw new NotFoundException('failed to update this product');
    }

    let attachments: string[] = [];
    if(files?.length){
      attachments = await this.s3Service.uploadFiles({
      files,
      path: `${FolderEnum.Category}/${(product.category as unknown as CategoryDocument).assetFolderId}/${FolderEnum.Product}/${product.assetFolderId}`,
    });
    }

    const removedAttachments = [...new Set(updateProductAttachmentDto.removedAttachments ?? [])];

    const updatedProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: [
        {
          $set:{
            updatedBy: user._id,
            images:{
              $setUnion:[
                {
                  $setDifference:[
                    "$images",
                    removedAttachments,
                  ]
                },
                attachments,
              ]
            },
          },
      }
    ],
    });
    if (!updatedProduct) {
      await this.s3Service.deleteFiles({ urls: attachments });
      throw new NotFoundException('failed to update this product');
    }
      await this.s3Service.deleteFiles({ urls: removedAttachments });

    return updatedProduct;
  }

  async freeze(productId: Types.ObjectId, user: UserDocument): Promise<string> {
    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        updatedBy: user._id,
        freezedAt: new Date(),
        $unset: { restoredAt: true },
      },
    });

    if (!product) {
      throw new NotFoundException(
        'product not found or product is already freezed',
      );
    }

    return 'Done';
  }

  async delete(productId: Types.ObjectId): Promise<string> {
    const product = await this.productRepository.findOneAndDelete({
      filter: { _id: productId, paranoId: false, freezedAt: { $exists: true } },
    });
    if (!product) {
      throw new NotFoundException(
        'product not found or product must be freezed first',
      );
    }
    await this.s3Service.deleteFiles({ urls: product.images });

    return 'Done';
  }

  async restore(
    productId: Types.ObjectId,
    user: UserDocument,
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId, paranoId: false, freezedAt: { $exists: true } },
      update: {
        updatedBy: user._id,
        restoredAt: new Date(),
        $unset: { freezedAt: true },
      },
    });

    if (!product) {
      throw new NotFoundException(
        'product not found or product is not freezed',
      );
    }

    return product;
  }

    async addToWishlist(
    productId: Types.ObjectId,
    user: UserDocument
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
      },
    });
    if (!product) {
      throw new NotFoundException('failed to find this product');
    }

    await this.userRepository.updateOne({
      filter: {
        _id: user._id,
      },
      update: {
      $addToSet:{wishlist: product._id}
      },
    });

    return product;
  }

    async removeFromWishlist(
    productId: Types.ObjectId,
    user: UserDocument
  ): Promise<string> {
    await this.userRepository.updateOne({
      filter: {
        _id: user._id,
      },
      update: {
      $pull:{wishlist: Types.ObjectId.createFromHexString(productId as unknown as string)},
      }
    });
    return "Done";
  }

}
