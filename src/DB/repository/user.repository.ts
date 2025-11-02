import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { UserDocument as TDocument, User } from 'src/DB/models/user.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class UserRepository extends DatabaseRepository<User>{
  constructor (@InjectModel(User.name) protected override readonly model:Model<TDocument>){
    super(model)
  }
}