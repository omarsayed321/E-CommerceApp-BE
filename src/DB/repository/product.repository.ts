import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { ProductDocument as TDocument, Product } from 'src/DB/models/product.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class ProductRepository extends DatabaseRepository<Product>{
  constructor (
    @InjectModel(Product.name) 
    protected override readonly model:Model<TDocument>
  ){
    super(model)
  }
}