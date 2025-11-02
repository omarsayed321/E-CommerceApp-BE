import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { TokenDocument as TDocument, Token } from 'src/DB/models/token.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class TokenRepository extends DatabaseRepository<Token>{
  constructor (@InjectModel(Token.name) protected override readonly model:Model<TDocument>){
    super(model)
  }
}