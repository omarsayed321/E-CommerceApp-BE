import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { OtpDocument as TDocument, Otp } from 'src/DB/models/otp.model';
import { DatabaseRepository } from "./database.repository";
import { Model } from "mongoose";

@Injectable()
export class OtpRepository extends DatabaseRepository<Otp>{
  constructor (
    @InjectModel(Otp.name) 
    protected override readonly model:Model<TDocument>
  ){
    super(model)
  }
}