import {
  Types,
  MongooseUpdateQueryOptions,
  UpdateQuery,
  UpdateWriteOpResult,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  CreateOptions,
  Model,
  FlattenMaps,
  DeleteResult,
  PopulateOptions,
  HydratedDocument
} from "mongoose";

export type Lean<T> = FlattenMaps<T>

export abstract class DatabaseRepository< TRawDocument, TDocument = HydratedDocument<TRawDocument>> {
  protected constructor(protected model:Model<TDocument>){}
  
    async findById({
      id,
      select,
      options,
    }: {
      id: Types.ObjectId;
      select?: ProjectionType<TDocument> | null;
      options?: QueryOptions<TDocument> | null;
    }): Promise<
      | TDocument
      | null
      |Lean<TDocument>
    > {
      const doc = this.model.findById(id).select(select || "");
      if (options?.lean) {
        doc.lean(options.lean);
      }
      if (options?.populate) {
        doc.populate(options.populate as PopulateOptions[]);
      }
      return await doc.exec();
    }

    async findOne({
      filter,
      select,
      options,
    }: {
      filter?: RootFilterQuery<TRawDocument>;
      select?: ProjectionType<TRawDocument> | null;
      options?: QueryOptions<TDocument> | null;
    }): Promise<
      | TDocument
      | null
      |Lean<TDocument>
    > {
      const doc = this.model.findOne(filter).select(select || "");
      if (options?.lean) {
        doc.lean(options.lean);
      }
      if (options?.populate) {
        doc.populate(options.populate as PopulateOptions[]);
      }
      return await doc.exec();
    }
  
    async find({
      filter,
      select,
      options,
    }: {
      filter?: RootFilterQuery<TRawDocument>;
      select?: ProjectionType<TRawDocument> | undefined;
      options?: QueryOptions<TDocument> | undefined;
    }): Promise<Array<TDocument | Lean<TDocument>>> {
      const doc = this.model.find(filter || {}).select(select || "");
      if (options?.lean) {
        doc.lean(options.lean);
      }
      if (options?.populate) {
        doc.populate(options.populate as PopulateOptions[]);
      }
      if (options?.limit) {
        doc.limit(options.limit);
      }
      if (options?.skip) {
        doc.skip(options.skip);
      }
  
      return await doc.exec();
    }
  
    async paginate({
      filter = {},
      options = {},
      select,
      page = "all",
      size = 5,
    }: {
      filter?: RootFilterQuery<TRawDocument>;
      select?: ProjectionType<TRawDocument> | undefined;
      options?: QueryOptions<TDocument> | undefined;
      page?: number | "all";
      size?: number;
    }): Promise<{
        docsCount?: number;
        limit?: number;
        pagesCount?: number;
        currentPage?: number | undefined;
        result: Array<TDocument | Lean<TDocument>>;
    }> {
      let docsCount: number | undefined = undefined;
      let pagesCount: number | undefined = undefined;
  
      if(page !== 'all'){
        page = Math.floor(!page || page < 1 ? 1 : page);
        options.limit = Math.floor(size < 1 || !size ? 5 : size);
        options.skip = (page - 1) * options.limit;
  
        docsCount = await this.model.countDocuments(filter);
        pagesCount = Math.ceil(docsCount / options.limit);
      }
  
      const result = await this.find({filter, select, options});
      return {
        docsCount, 
        limit:options.limit, 
        pagesCount, 
        currentPage: page !== "all" ? page:undefined, 
        result,
      };
    }
  
    async create({
      data,
      options,
    }: {
      data: Partial<TRawDocument>[];
      options?: CreateOptions | undefined;
    }): Promise<TDocument[]> {
      return (await this.model.create(data, options)) || [];
    }
  
    async insertMany({
      data,
    }: {
      data: Partial<TDocument>[];
    }): Promise<TDocument[] | undefined> {
      return (await this.model.insertMany(data)) as TDocument[];
    }

    async updateOne({
      filter,
      update,
      options,
    }: {
      filter: RootFilterQuery<TRawDocument>;
      update: UpdateQuery<TDocument>;
      options?: MongooseUpdateQueryOptions<TDocument> | null;
    }): Promise<UpdateWriteOpResult> {
      if(Array.isArray(update)){
        update.push({
          $set:{
            __v: { $add: ["$__v", 1] },
          }
        });
        return await this.model.updateOne(
          filter || {},
          update,
          options
        );
      }
      return await this.model.updateOne(
        filter || {},
        { ...update, $inc: { __v: 1 } },
        options
      );
    }
      
    async findOneAndUpdate({
      filter,
      update,
      options = {new:true},
    }: {
      filter?: RootFilterQuery<TRawDocument>;
      update?: UpdateQuery<TDocument>;
      options?: QueryOptions<TDocument> | null;
    }): Promise<TDocument | null | Lean<TDocument>> {

      if(Array.isArray(update)){
        update.push({
          $set:{
            __v: { $add: ["$__v", 1] },
          }
        });
        return await this.model.findOneAndUpdate(
          filter || {},
          update,
          options
        );
      }

      return await this.model.findOneAndUpdate(
        filter,
      { ...update, $inc: { __v: 1 } },
        options
      );
    }
  
    async findByIdAndUpdate({
      id,
      update,
      options = {new:true},
    }: {
      id: Types.ObjectId;
      update?: UpdateQuery<TDocument>;
      options?: QueryOptions<TDocument> | null;
    }): Promise<TDocument | null |Lean<TDocument>> {
      return await this.model.findByIdAndUpdate(
        id,
      { ...update, $inc: { __v: 1 } },
        options
      );
    }
          
    async findOneAndDelete({
      filter,
    }: {
      filter?: RootFilterQuery<TRawDocument>;
    }): Promise<TDocument | null | Lean<TDocument>> {
      return await this.model.findOneAndDelete(filter || {});
    }

    async deleteOne({
      filter,
    }: {
      filter: RootFilterQuery<TRawDocument>;
    }): Promise<DeleteResult> {
      return this.model.deleteOne(filter);
    }
  
    async deleteMany({
      filter,
    }: {
      filter: RootFilterQuery<TRawDocument>;
    }): Promise<DeleteResult> {
      return this.model.deleteMany(filter);
    }


}