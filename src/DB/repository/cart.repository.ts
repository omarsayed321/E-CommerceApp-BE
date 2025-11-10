import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { CartDocument as TDocument, Cart } from 'src/DB/models/cart.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class CartRepository extends DatabaseRepository<Cart>{
  constructor (
    @InjectModel(Cart.name) 
    protected override readonly model:Model<TDocument>
  ){
    super(model)
  }
}