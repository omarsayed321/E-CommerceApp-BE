import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { CategoryDocument as TDocument, Category } from 'src/DB/models/category.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class CategoryRepository extends DatabaseRepository<Category>{
  constructor (
    @InjectModel(Category.name) 
    protected override readonly model:Model<TDocument>
  ){
    super(model)
  }
}