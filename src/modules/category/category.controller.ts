import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, ParseFilePipe, UseInterceptors, UsePipes, ValidationPipe, Query } from '@nestjs/common';

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

import { User } from 'src/common/decorator/credential.decorator';
import type { UserDocument } from 'src/DB/models/user.model';

import { successResponse } from 'src/common/utils/response';

import { IResponse } from 'src/common/interfaces/response.interface';
import { ICategory } from 'src/common/interfaces/category.interface';

import { Auth } from 'src/common/decorator/auth.decorator';

import { RoleEnum } from 'src/common/enums/user.enum';
import { UpdateCategoryDto, CategoryParamsDto} from './dto/update-category.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload } from 'src/common/utils/multer/cloud.multer.options';
import { fileValidation } from 'src/common/utils/multer/validation.multer';

import { SearchDto } from 'src/common/dtos/search.dto';

import { GetAllResponse } from 'src/common/entities/search.entity';

@UsePipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true}))
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseInterceptors(FileInterceptor(
  'attachment',
  cloudFileUpload({validation: fileValidation.image})
  ))
  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Post()
  async create(
    @User() user: UserDocument,
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<{category: ICategory}>> {
    const category = await this.categoryService.create(createCategoryDto, file, user);
    return successResponse<{category: ICategory}>({status: 201, data: {category}})
  }

  @Get()
  async findAll(@Query() query: SearchDto): Promise<IResponse<GetAllResponse<ICategory>>>{
  const result = await this.categoryService.findAll(query);
    return successResponse<GetAllResponse<ICategory>>({data: {result}});
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Get('/archive')
  async findAllArchives(@Query() query: SearchDto): Promise<IResponse<GetAllResponse<ICategory>>>{
  const result = await this.categoryService.findAll(query, true);
    return successResponse<GetAllResponse<ICategory>>({data: {result}});
  }

  @Get(':categoryId')
  async findOne(@Param() params: CategoryParamsDto): Promise<IResponse<{category: ICategory}>>{
  const category = await this.categoryService.findOne(params.categoryId);
    return successResponse<{category: ICategory}>({data:{category}});
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Get(':categoryId/archive')
  async findOneArchive(@Param() params: CategoryParamsDto): Promise<IResponse<{category: ICategory}>>{
  const category = await this.categoryService.findOne(params.categoryId, true);
    return successResponse<{category: ICategory}>({data:{category}});
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(':categoryId')
  async update(
    @Param() params: CategoryParamsDto, 
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: UserDocument,
  ): Promise<IResponse<{updatedCategory: ICategory}>> {
    const updatedCategory = await this.categoryService.update(params.categoryId, updateCategoryDto, user);
    return successResponse<{updatedCategory: ICategory}>({ data: {updatedCategory}})
  } 

  @UseInterceptors(FileInterceptor(
    'attachment',
    cloudFileUpload({validation: fileValidation.image})
  ))
  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(':categoryId/attachment')
  async updateAttachment(
    @Param() params: CategoryParamsDto, 
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: UserDocument,
  ): Promise<IResponse<{updatedCategory: ICategory}>> {
    const updatedCategory = await this.categoryService.updateAttachment(params.categoryId, file, user);
    return successResponse<{updatedCategory: ICategory}>({ data: {updatedCategory}})
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Delete(':categoryId/freeze')
  async freeze(
    @Param() params: CategoryParamsDto, 
    @User() user: UserDocument,
  ): Promise<IResponse> {
    await this.categoryService.freeze(params.categoryId, user);
    return successResponse()
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Delete(':categoryId/delete')
  async delete(
    @Param() params: CategoryParamsDto, 
  ): Promise<IResponse> {
    await this.categoryService.delete(params.categoryId);
    return successResponse({status:204})
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(':categoryId/restore')
  async restore(
    @Param() params: CategoryParamsDto, 
    @User() user: UserDocument,
  ): Promise<IResponse<{category: ICategory}>> {
    const category = await this.categoryService.restore(params.categoryId, user);
    return successResponse<{category: ICategory}>({data:{category}})
  }
}
