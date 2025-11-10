import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, ParseFilePipe, UseInterceptors, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';

import { User } from 'src/common/decorator/credential.decorator';
import type { UserDocument } from 'src/DB/models/user.model';

import { successResponse } from 'src/common/utils/response';

import { IResponse } from 'src/common/interfaces/response.interface';
import { IBrand } from 'src/common/interfaces/brand.interface';

import { Auth } from 'src/common/decorator/auth.decorator';

import { RoleEnum } from 'src/common/enums/user.enum';
import { UpdateBrandDto, BrandParamsDto, GetAllBrandsDto } from './dto/update-brand.dto';
import { GetAllBrandsResponse } from './entities/brand.entity';

import { FileInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload } from 'src/common/utils/multer/cloud.multer.options';
import { fileValidation } from 'src/common/utils/multer/validation.multer';

@UsePipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true}))
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @UseInterceptors(FileInterceptor(
  'attachment',
  cloudFileUpload({validation: fileValidation.image})
  ))
  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Post()
  async create(
    @User() user: UserDocument,
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<{brand: IBrand}>> {
    const brand = await this.brandService.create(createBrandDto, file, user);
    return successResponse<{brand: IBrand}>({status: 201, data: {brand}})
  }

  @Get()
  async findAll(@Query() query: GetAllBrandsDto): Promise<IResponse<GetAllBrandsResponse>>{
  const result = await this.brandService.findAll(query);
    return successResponse<GetAllBrandsResponse>({data: {result}});
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Get('/archive')
  async findAllArchives(@Query() query: GetAllBrandsDto): Promise<IResponse<GetAllBrandsResponse>>{
  const result = await this.brandService.findAll(query, true);
    return successResponse<GetAllBrandsResponse>({data: {result}});
  }

  @Get(':brandId')
  async findOne(@Param() params: BrandParamsDto): Promise<IResponse<{brand: IBrand}>>{
  const brand = await this.brandService.findOne(params.brandId);
    return successResponse<{brand: IBrand}>({data:{brand}});
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Get(':brandId/archive')
  async findOneArchives(@Param() params: BrandParamsDto): Promise<IResponse<{brand: IBrand}>>{
  const brand = await this.brandService.findOne(params.brandId, true);
    return successResponse<{brand: IBrand}>({data:{brand}});
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(':brandId')
  async update(
    @Param() params: BrandParamsDto, 
    @Body() updateBrandDto: UpdateBrandDto,
    @User() user: UserDocument,
  ): Promise<IResponse<{updatedBrand: IBrand}>> {
    const updatedBrand = await this.brandService.update(params.brandId, updateBrandDto, user);
    return successResponse<{updatedBrand: IBrand}>({ data: {updatedBrand}})
  } 

  @UseInterceptors(FileInterceptor(
    'attachment',
    cloudFileUpload({validation: fileValidation.image})
  ))
  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(':brandId/attachment')
  async updateAttachment(
    @Param() params: BrandParamsDto, 
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: UserDocument,
  ): Promise<IResponse<{updatedBrand: IBrand}>> {
    const updatedBrand = await this.brandService.updateAttachment(params.brandId, file, user);
    return successResponse<{updatedBrand: IBrand}>({ data: {updatedBrand}})
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Delete(':brandId/freeze')
  async freeze(
    @Param() params: BrandParamsDto, 
    @User() user: UserDocument,
  ): Promise<IResponse> {
    await this.brandService.freeze(params.brandId, user);
    return successResponse()
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Delete(':brandId/delete')
  async delete(
    @Param() params: BrandParamsDto, 
  ): Promise<IResponse> {
    await this.brandService.delete(params.brandId);
    return successResponse({status:204})
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(':brandId/restore')
  async restore(
    @Param() params: BrandParamsDto, 
    @User() user: UserDocument,
  ): Promise<IResponse<{brand: IBrand}>> {
    const brand = await this.brandService.restore(params.brandId, user);
    return successResponse<{brand: IBrand}>({data:{brand}})
  }
}
