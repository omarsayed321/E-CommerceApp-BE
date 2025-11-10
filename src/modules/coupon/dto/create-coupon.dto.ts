import { CouponEnum } from './../../../common/enums/coupon.enum';
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @Type(()=>Number)
  @IsPositive()
  @IsNumber()
  discount: number;
  @Type(()=>Number)
  @IsPositive()
  @IsNumber()
  duration: number;

  @IsDateString()
  startDate: Date;
  @IsDateString()
  endDate: Date;

  @IsEnum(CouponEnum)
  type: CouponEnum;    
}
