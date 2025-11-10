import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import { IProduct } from 'src/common/interfaces/product.interface';

import slugify from 'slugify';

@Schema({ timestamps: true, strictQuery: true, strict: true })
export class Product implements IProduct {
  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 2000,
  })
  name: string;
  @Prop({ type: String, minLength: 2, maxLength: 25 })
  slug: string;
  @Prop({ type: String, minLength: 2, maxLength: 50000 })
  description: string;
  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ type: String, required: true })
  assetFolderId: string;

  @Prop({ type: Number, required: true, min: 0 })
  originalPrice: number;
  @Prop({ type: Number, required: true, min: 0 })
  salePrice: number;
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ type: Number, required: true, min: 0 })
  stock: number;
  @Prop({ type: Number, default: 0, min: 0 })
  soldItems: number;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Category' })
  category: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true, ref: 'Brand' })
  brand: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  freezedAt?: Date;
  @Prop({ type: Date })
  restoredAt?: Date;
}

export type ProductDocument = HydratedDocument<Product>;
const productSchema = SchemaFactory.createForClass(Product);

productSchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

productSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
  const update = this.getUpdate() as UpdateQuery<ProductDocument>;

  // Handle aggregation pipelines (arrays)
  if (Array.isArray(update)) {
    // Find the $set stage (or create one if it doesn't exist)
    let setStage = update.find((stage) => stage.$set);
    if (!setStage) {
      setStage = { $set: {} };
      update.push(setStage); // Add a new $set stage at the end
    }

    // If name is being updated in $set, generate and add slug
    if (setStage.$set.name) {
      setStage.$set.slug = slugify(setStage.$set.name);
    }
  } else {
    // Handle plain update objects (existing logic)
    if (update.name) {
      this.setUpdate({ ...update, slug: slugify(update.name) });
    }
  }

  const query = this.getQuery();
  if (query.paranoId === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }

  next();
});

productSchema.pre(['find', 'findOne'], async function (next) {
  const query = this.getQuery();
  if (query.paranoId === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }

  next();
});

export const ProductModel = MongooseModule.forFeature([
  { name: Product.name, schema: productSchema },
]);
