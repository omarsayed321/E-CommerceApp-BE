import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { BrandDocument as TDocument, Brand } from 'src/DB/models/brand.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class BrandRepository extends DatabaseRepository<Brand>{
  constructor (
    @InjectModel(Brand.name) 
    protected override readonly model:Model<TDocument>
  ){
    super(model)
  }
}