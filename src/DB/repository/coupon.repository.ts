import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { CouponDocument as TDocument, Coupon } from 'src/DB/models/coupon.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class CouponRepository extends DatabaseRepository<Coupon>{
  constructor (
    @InjectModel(Coupon.name) 
    protected override readonly model:Model<TDocument>
  ){
    super(model)
  }
}