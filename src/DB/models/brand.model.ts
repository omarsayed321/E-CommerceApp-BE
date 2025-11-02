import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import { IBrand } from 'src/common/interfaces/brand.interface';

import slugify from 'slugify';

@Schema({ timestamps: true, strictQuery: true })
export class Brand implements IBrand {

  @Prop({ type: String, required: true, unique:true, minLength:2, maxLength: 25 })
  name: string;

    @Prop({ type: String, minLength:2, maxLength: 25 })
  slug: string;

      @Prop({ type: String, required: true, minLength:2, maxLength: 25 })
  slogan: string;
  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User'})
  updatedBy: Types.ObjectId;

  @Prop({type: Date})
  freezedAt: Date;
  @Prop({type: Date})
  restoredAt: Date;

}

export type BrandDocument = HydratedDocument<Brand>;
const brandSchema = SchemaFactory.createForClass(Brand);

brandSchema.pre('save',async function (next) {
  if(this.isModified('name')){
    this.slug = slugify(this.name);
  }
  next();
});

brandSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
  const update = this.getUpdate() as UpdateQuery<BrandDocument>;
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

brandSchema.pre(['find', 'findOne'], async function (next) {
  const query = this.getQuery();
  if(query.paranoId === false){
    this.setQuery({...query});
  }else{
    this.setQuery({...query, freezedAt: {$exists: false}});
  }

  next();
});

export const BrandModel = MongooseModule.forFeature([
  { name: Brand.name, schema: brandSchema },
]);
