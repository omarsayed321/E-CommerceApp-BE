import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { S3Service } from './../../common/services/s3.service';

import { BrandRepository } from './../../DB/repository/brand.repository';

import { CategoryRepository } from './../../DB/repository/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryDocument } from 'src/DB/models/category.model';
import {UpdateCategoryDto } from './dto/update-category.dto';

import { SearchDto } from './../../common/dtos/search.dto';

import { UserDocument } from 'src/DB/models/user.model';

import { FolderEnum } from 'src/common/enums/multer.enum';

import { Lean } from 'src/DB/repository/database.repository';
import { Types } from 'mongoose';
import { randomUUID } from 'crypto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<CategoryDocument> {
    const { name } = createCategoryDto;

    const checkDuplicated = await this.categoryRepository.findOne({
      filter: { name, paranoId: false },
    });
    if (checkDuplicated) {
      throw new ConflictException(
        checkDuplicated.freezedAt
          ? 'this category is freezed'
          : 'duplicated category name',
      );
    }

    const brands: Types.ObjectId[] = [...new Set(createCategoryDto.brands || [])];
    if(brands && (await this.brandRepository.find({filter: {_id: {$in: brands}}})).length != brands.length) {
      throw new NotFoundException('one or more brands not found');
    }

    let assetFolderId: string = randomUUID();

    const image: string = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.Category}/${assetFolderId}`,
    });

    const [category] = await this.categoryRepository.create({
      data: [
        {
          ...createCategoryDto, 
          image, 
           assetFolderId, 
          createdBy: user._id ,
           brands: brands.map((brand) => {return Types.ObjectId.createFromHexString (brand as unknown as string)})
        }
      ],
    });
    if (!category) {
      await this.s3Service.deleteFile({ Key: image });
      throw new BadRequestException('failed to create this category ');
    }

    return category;
  }

  async findAll(data: SearchDto, archive: boolean = false,): Promise<{
        docsCount?:number; 
        limit?:number; 
        pagesCount?:number; 
        currentPage?:number | undefined; 
        result: Array<CategoryDocument | Lean<CategoryDocument>>;
    }> {
    const {page, size, search} = data;
    const result = await this.categoryRepository.paginate({
      filter: {
        ...(search
        ?{
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ]
        }:
        {}),

        ...(archive?{paranoId: false, freezedAt: {$exists:true}}:{}),
      },
      page,
      size,
    })

    return result;
  }

  async findOne( categoryId: Types.ObjectId, archive: boolean = false,)
  : Promise<CategoryDocument | Lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOne({
      filter: {
        _id:categoryId,
        ...(archive?{paranoId: false, freezedAt: {$exists:true}}:{}),
      },
    });
    if(!category){
      throw new NotFoundException("failed to find this category");
    }

    return category;
  }

  async findOneArchive( categoryId: Types.ObjectId, archive: boolean = false,)
  : Promise<CategoryDocument | Lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOne({
      filter: {
        _id:categoryId,
        ...(archive?{paranoId: false, freezedAt: {$exists:true}}:{}),
      },
    });
    if(!category){
      throw new NotFoundException("failed to find this category");
    }

    return category;
  }

  async update(
    categoryId: Types.ObjectId,
    updateCategoryDto: UpdateCategoryDto,
    user: UserDocument,
  ): Promise<CategoryDocument | Lean<CategoryDocument>> {
    if (
      updateCategoryDto.name &&
      (await this.categoryRepository.findOne({
        filter: { name: updateCategoryDto.name },
      }))
    ) {
      throw new ConflictException('Duplicated category name');
    }
    
    const removeBrands = updateCategoryDto.removeBrands ?? [];
    delete updateCategoryDto.removeBrands;
   
    const brands: Types.ObjectId[] = [...new Set(updateCategoryDto.brands || [])];

    // Get current category with its brands
    const currentCategory = await this.categoryRepository.findOne({
      filter: { _id: categoryId }
    });
    if (!currentCategory) {
      throw new NotFoundException('Category not found');
    }

    // Check if brands to remove exist in current category
    const currentBrandIds = currentCategory.brands.map(b => b.toString());
    const nonExistingRemoveBrands = removeBrands.filter(b => !currentBrandIds.includes(b.toString()));
    if (nonExistingRemoveBrands.length > 0) {
      throw new BadRequestException('Cannot remove brands that are not in the category');
    }

    // Check if brands to add are already in the category
    const existingAddBrands = brands.filter(b => currentBrandIds.includes(b.toString()));
    if (existingAddBrands.length > 0) {
      throw new BadRequestException('Cannot add brands that are already in the category');
    }

    // Validate that all brands exist in the database
    const combinedBrands = [...new Set([...brands, ...removeBrands])];
    if (combinedBrands.length > 0) {
      const found = await this.brandRepository.find({ filter: { _id: { $in: combinedBrands } } });
      if (found.length !== combinedBrands.length) {
        throw new NotFoundException('One or more brands not found');
      }
    }

    const updatedCategory = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: [
        {
          $set: {
            ...updateCategoryDto,
            updatedBy: user._id,
            brands: {
              $setUnion: [
                {
                  $setDifference: [
                    '$brands',
                    removeBrands.map((brand) => Types.ObjectId.createFromHexString(brand as unknown as string)),
                  ],
                },
                brands.map((brand) => Types.ObjectId.createFromHexString(brand as unknown as string)),
              ]
            }
          }
        }
      ],
    });
    if (!updatedCategory) {
      throw new NotFoundException('Failed to update this category');
    }

    return updatedCategory;
  }

  async updateAttachment(
    categoryId: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<CategoryDocument | Lean<CategoryDocument>> {
    
    const category = await this.categoryRepository.findOne({
      filter: { _id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('failed to update this category');
    }

    const image = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.Category}/${category.assetFolderId}`,
    });

    const updatedCategory = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        image,
        updatedBy: user._id,
      },
    });
    if (!updatedCategory) {
      await this.s3Service.deleteFile({ Key: image });
      throw new NotFoundException('failed to update this category');
    }
    // delete old image
    await this.s3Service.deleteFile({ Key: category.image });

    return updatedCategory;
  }

  async freeze(categoryId: Types.ObjectId, user: UserDocument): Promise<string> {
    const category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        updatedBy: user._id,
        freezedAt: new Date(),
        $unset: { restoredAt: true },
      },
    });

    if (!category) {
      throw new NotFoundException(
        'category not found or category is already freezed',
      );
    }

    return 'Done';
  }

  async delete(categoryId: Types.ObjectId): Promise<string> {
    const category = await this.categoryRepository.findOneAndDelete({
      filter: { _id: categoryId, paranoId: false, freezedAt: { $exists: true } },
    });
    if (!category) {
      throw new NotFoundException(
        'category not found or category must be freezed first',
      );
    }
    await this.s3Service.deleteFile({ Key: category.image });

    return 'Done';
  }

  async restore(
    categoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<CategoryDocument | Lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId, paranoId: false, freezedAt: { $exists: true } },
      update: {
        updatedBy: user._id,
        restoredAt: new Date(),
        $unset: { freezedAt: true },
      },
    });

    if (!category) {
      throw new NotFoundException('category not found or category is not freezed');
    }

    return category;
  }
}
