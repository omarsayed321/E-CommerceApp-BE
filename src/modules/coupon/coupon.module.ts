import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { S3Service } from 'src/common/services/s3.service';
import { CouponRepository } from 'src/DB/repository/coupon.repository';
import { CouponModel } from 'src/DB/models/coupon.model';

@Module({
  imports:[CouponModel],
  controllers: [CouponController],
  providers: [CouponService, CouponRepository, S3Service],
})
export class CouponModule {}
