import { CouponEnum } from './../../common/enums/coupon.enum';
import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import { ICoupon } from 'src/common/interfaces/coupon.interface';

import slugify from 'slugify';

@Schema({ timestamps: true, strictQuery: true })
export class Coupon implements ICoupon {

  @Prop({ type: String, required: true, unique:true, minLength:2, maxLength: 25 })
  name: string;
  
  @Prop({ type: String, minLength:2, maxLength: 25 })
  slug: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: Date, required: true })
  startDate: Date;
  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Number, required: true })
  discount: number;
  @Prop({ type: Number, default: 1 })
  duration: number;
  @Prop({ type: String, enum:CouponEnum, default: CouponEnum.percent })
  type: CouponEnum;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User'})
  updatedBy: Types.ObjectId;
  @Prop({type:[{ type: Types.ObjectId, ref: 'User' }]})
  usedBy: Types.ObjectId[];

  @Prop({type: Date})
  freezedAt: Date;
  @Prop({type: Date})
  restoredAt: Date;

}

export type CouponDocument = HydratedDocument<Coupon>;
const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.pre('save',async function (next) {
  if(this.isModified('name')){
    this.slug = slugify(this.name);
  }
  next();
});

CouponSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
  const update = this.getUpdate() as UpdateQuery<CouponDocument>;
  if(update.name) {
    this.setUpdate({...update, slug: slugify(update.name)})
  }

  const query = this.getQuery();
  if(query.paranoId === false){
    this.setQuery({...query});
  }else{
    this.setQuery({...query, freezedAt: {$exists: false}});
  }

  next();
});

CouponSchema.pre(['find', 'findOne'], async function (next) {
  const query = this.getQuery();
  if(query.paranoId === false){
    this.setQuery({...query});
  }else{
    this.setQuery({...query, freezedAt: {$exists: false}});
  }

  next();
});

export const CouponModel = MongooseModule.forFeature([
  { name: Coupon.name, schema: CouponSchema },
]);
