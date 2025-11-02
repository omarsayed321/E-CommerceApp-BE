import { S3Service } from './../../common/services/s3.service';
import { BrandRepository } from './../../DB/repository/brand.repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UserDocument } from 'src/DB/models/user.model';
import { BrandDocument } from 'src/DB/models/brand.model';
import { FolderEnum } from 'src/common/enums/multer.enum';
import { Lean } from 'src/DB/repository/database.repository';
import { Types } from 'mongoose';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepository:BrandRepository,
    private readonly s3Service:S3Service,
  ){}

  async create(
    createBrandDto: CreateBrandDto,
    file: Express.Multer.File,
    user: UserDocument,

  ): Promise<BrandDocument> {
    const {name, slogan} = createBrandDto;

    const checkDuplicated = await this.brandRepository.findOne({
      filter:{name, paranoId:false},
    });
    if(checkDuplicated){
      throw new ConflictException(checkDuplicated.freezedAt 
        ? "this brand is freezed" 
        : "duplicated brand name"
      );
    }

    const image: string = await this.s3Service.uploadFile({
      file,
      path: "Brand",
    });

    const [brand] = await this.brandRepository.create({
      data: [{name, slogan, image, createdBy: user._id}],
    })
    if(!brand) {
      await this.s3Service.deleteFile({Key: image});
      throw new BadRequestException("failed to create this brand ");
    }

    return brand;
  }

  async update(
      brandId: Types.ObjectId, 
      updateBrandDto: UpdateBrandDto,
     user: UserDocument
    ): Promise<BrandDocument | Lean<BrandDocument>> {
    if(
      updateBrandDto.name && 
      (await this.brandRepository.findOne({
      filter: { name: updateBrandDto.name }
    }))
  ) {
      throw new ConflictException("Duplicated brand name");
    }

    const updatedBrand = await this.brandRepository.findOneAndUpdate({
      filter: {_id: brandId},
      update: {
        ...updateBrandDto,
        updatedBy: user._id
      }
    })
    if(!updatedBrand){
      throw new NotFoundException("failed to update this brand")
    }

    return updatedBrand;
  }

  async updateAttachment(
      brandId: Types.ObjectId, 
      file: Express.Multer.File,
     user: UserDocument
    ): Promise<BrandDocument | Lean<BrandDocument>> {

      const image = await this.s3Service.uploadFile({file, path:FolderEnum.Brand})
    const updatedBrand = await this.brandRepository.findOneAndUpdate({
      filter: {_id: brandId},
      update: {
        image,
        updatedBy: user._id
      },
      options: {
        new: false,
      }
    })
    if(!updatedBrand){
      await this.s3Service.deleteFile({Key: image});
      throw new NotFoundException("failed to update this brand");
    }
    // delete old image
      await this.s3Service.deleteFile({Key: updatedBrand.image});
      updatedBrand.image = image;

    return updatedBrand;
  }

  findAll() {
    return `This action returns all brand`;
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }

  async freeze(
      brandId: Types.ObjectId, 
     user: UserDocument
    ): Promise<string> {

    const brand = await this.brandRepository.findOneAndUpdate({
      filter: {_id: brandId,},
      update: {
        updatedBy: user._id,
        freezedAt: new Date(),
        $unset:{restoredAt: true},
      }
    })

    if(!brand){
            throw new NotFoundException('brand not found or brand is already freezed');

    }

    return "Done";
  }

  async delete(
      brandId: Types.ObjectId, 
    ): Promise<string> {

    const brand = await this.brandRepository.findOneAndDelete({
      filter: {_id: brandId, paranoId: false, freezedAt: {$exists: true}},
    })

    throw new NotFoundException('brand not found or brand must be freezed first');

    await this.s3Service.deleteFile({Key: brand.image});

    return "Done";
  }

  async restore(
      brandId: Types.ObjectId, 
     user: UserDocument
    ): Promise<BrandDocument | Lean<BrandDocument>> {

    const brand = await this.brandRepository.findOneAndUpdate({
      filter: {_id: brandId, paranoId: false, freezedAt: {$exists: true}},
      update: {
        updatedBy: user._id,
        restoredAt: new Date(),
        $unset:{freezedAt: true},
      }
    })
    
    if(!brand){
            throw new NotFoundException('brand not found or brand is not freezed');

    }

    return brand;
  }


}
