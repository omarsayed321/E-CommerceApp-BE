import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, ParseFilePipe, UsePipes, ValidationPipe, Query } from '@nestjs/common';

import { ProductService } from './product.service';

import { CreateProductDto } from './dto/create-product.dto';
import { ProductParamsDto, UpdateProductDto, UpdateProductAttachmentDto } from './dto/update-product.dto';

import { FilesInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload } from 'src/common/utils/multer/cloud.multer.options';
import { fileValidation } from 'src/common/utils/multer/validation.multer';

import { Auth } from 'src/common/decorator/auth.decorator';

import { RoleEnum } from 'src/common/enums/user.enum';
import { StorageEnum } from 'src/common/enums/multer.enum';

import { User } from 'src/common/decorator/credential.decorator';
import type { UserDocument } from 'src/DB/models/user.model';

import { successResponse } from 'src/common/utils/response';
import { IResponse } from 'src/common/interfaces/response.interface';

import { IProduct } from 'src/common/interfaces/product.interface';

import { GetAllResponse } from 'src/common/entities/search.entity';

import { SearchDto } from 'src/common/dtos/search.dto';

@UsePipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true}))
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  
  @UseInterceptors(FilesInterceptor('attachments', 5, cloudFileUpload({validation: fileValidation.image, storageApproach: StorageEnum.memory})))
  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Post()
  create(
    @UploadedFiles(ParseFilePipe) files: Express.Multer.File[],
    @User() user: UserDocument,
    @Body() createProductDto: CreateProductDto
  ) {
    return this.productService.create(createProductDto, files ,user);
  }

  @Get()
  async findAll(@Query() query: SearchDto): Promise<IResponse<GetAllResponse<IProduct>>>{
  const result = await this.productService.findAll(query);
    return successResponse<GetAllResponse<IProduct>>({data: {result}});
  }
  

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Get('/archive')
  async findAllArchives(@Query() query: SearchDto): Promise<IResponse<GetAllResponse<IProduct>>>{
  const result = await this.productService.findAll(query, true);
    return successResponse<GetAllResponse<IProduct>>({data: {result}});
  }

  @Get(':productId')
  async findOne(@Param() params: ProductParamsDto): Promise<IResponse<{product: IProduct}>>{
  const product = await this.productService.findOne(params.productId);
    return successResponse<{product: IProduct}>({data:{product}});
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Get(':productId/archive')
  async findOneArchive(@Param() params: ProductParamsDto): Promise<IResponse<{product: IProduct}>>{
  const product = await this.productService.findOne(params.productId, true);
    return successResponse<{product: IProduct}>({data:{product}});
  }

 
   @Auth([RoleEnum.admin, RoleEnum.superAdmin])
   @Patch(':productId')
   async update(
     @Param() params: ProductParamsDto, 
     @Body() updateProductDto: UpdateProductDto,
     @User() user: UserDocument,
   ): Promise<IResponse<{updatedProduct: IProduct}>> {
     const updatedProduct = await this.productService.update(params.productId, updateProductDto, user);
     return successResponse<{updatedProduct: IProduct}>({ data: {updatedProduct}})
   } 
 
@UseInterceptors(FilesInterceptor('attachments', 5, cloudFileUpload({validation: fileValidation.image, storageApproach: StorageEnum.memory})))
   @Auth([RoleEnum.admin, RoleEnum.superAdmin])
   @Patch(':productId/attachment')
   async updateAttachment( 
     @Param() params: ProductParamsDto, 
     @Body() updateProductAttachmentDto: UpdateProductAttachmentDto,
     @User() user: UserDocument,
     @UploadedFiles(new ParseFilePipe({fileIsRequired: false})) files?: Express.Multer.File[],
   ): Promise<IResponse<{updatedProduct: IProduct}>> {
     const updatedProduct = await this.productService.updateAttachment(params.productId, updateProductAttachmentDto,user ,files );
     return successResponse<{updatedProduct: IProduct}>({ data: {updatedProduct}})
   }
 
   @Auth([RoleEnum.admin, RoleEnum.superAdmin])
   @Delete(':productId/freeze')
   async freeze(
     @Param() params: ProductParamsDto, 
     @User() user: UserDocument,
   ): Promise<IResponse> {
     await this.productService.freeze(params.productId, user);
     return successResponse()
   }
 
   @Auth([RoleEnum.admin, RoleEnum.superAdmin])
   @Delete(':productId/delete')
   async delete(
     @Param() params: ProductParamsDto, 
   ): Promise<IResponse> {
     await this.productService.delete(params.productId);
     return successResponse({status:204})
   }
 
   @Auth([RoleEnum.admin, RoleEnum.superAdmin])
   @Patch(':productId/restore')
   async restore(
     @Param() params: ProductParamsDto, 
     @User() user: UserDocument,
   ): Promise<IResponse<{product: IProduct}>> {
     const product = await this.productService.restore(params.productId, user);
     return successResponse<{product: IProduct}>({data:{product}})
   }
   
   @Auth([RoleEnum.user])
  @Patch(':productId/add-to-wishlist')
  async addToWishlist(
    @User() user: UserDocument,
    @Param() params: ProductParamsDto, 
  ):  Promise<IResponse<{product: IProduct}>> {
    const product = await this.productService.addToWishlist(params.productId, user);
    return successResponse<{product: IProduct}>({data:{product}})

  }

   @Auth([RoleEnum.user]) 
  @Patch(':productId/remove-from-wishlist')
  async removeFromWishlist(
    @User() user: UserDocument,
    @Param() params: ProductParamsDto, 
  ):  Promise<IResponse> {
    await this.productService.removeFromWishlist(params.productId, user);
    return successResponse();
  }

}
