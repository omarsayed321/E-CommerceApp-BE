import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  ParseFilePipe,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';

import { RoleEnum } from 'src/common/enums/user.enum';

import { FileInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload } from 'src/common/utils/multer/cloud.multer.options';
import { fileValidation } from 'src/common/utils/multer/validation.multer';

import type { UserDocument } from 'src/DB/models/user.model';
import { User } from 'src/common/decorator/credential.decorator';

import { CouponService } from './coupon.service';

import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

import { Auth } from 'src/common/decorator/auth.decorator';

import { CouponResponse } from './entities/coupon.entity';
import { successResponse } from 'src/common/utils/response';
import { IResponse } from 'src/common/interfaces/response.interface';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudFileUpload({ validation: fileValidation.image }),
    ),
  )
  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Post()
  async create(
    @User() user: UserDocument,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @Body() createCouponDto: CreateCouponDto,
  ): Promise<IResponse<CouponResponse>> {
    const coupon = await this.couponService.create(createCouponDto, user, file);
    return successResponse<CouponResponse>({ status: 201, data: { coupon } });
  }

  @Get()
  findAll() {
    return this.couponService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(+id, updateCouponDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponService.remove(+id);
  }
}
