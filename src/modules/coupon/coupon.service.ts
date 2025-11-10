import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

import { CouponRepository } from 'src/DB/repository/coupon.repository';
import { CouponDocument } from 'src/DB/models/coupon.model';

import { S3Service } from 'src/common/services/s3.service';

import { UserDocument } from 'src/DB/models/user.model';

import { FolderEnum } from 'src/common/enums/multer.enum';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(createCouponDto: CreateCouponDto, user: UserDocument, file: Express.Multer.File): Promise<CouponDocument> {
    const checkDuplicated = await this.couponRepository.findOne({
      filter:{
        name: createCouponDto.name,
        paranoId: false
      }
    })
    if(checkDuplicated){
      throw new ConflictException('Duplicated Coupon Name');
    }

    const image = await this.s3Service.uploadFile({file, path: FolderEnum.Coupon});
    
    const [coupon] = await this.couponRepository.create({
      data: [{
      ...createCouponDto,
      image,
      createdBy: user._id,
      }]
    });
    if(!coupon){
      await this.s3Service.deleteFile({Key: image});
      throw new BadRequestException('Failed to create coupon');
    }
    return coupon;
  }

  findAll() {
    return `This action returns all coupon`;
  }

  findOne(id: number) {
    return `This action returns a #${id} coupon`;
  }

  update(id: number, updateCouponDto: UpdateCouponDto) {
    return `This action updates a #${id} coupon`;
  }

  remove(id: number) {
    return `This action removes a #${id} coupon`;
  }
}
