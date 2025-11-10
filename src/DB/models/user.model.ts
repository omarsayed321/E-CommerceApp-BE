import { MongooseModule, Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { HydratedDocument, Types, UpdateQuery } from "mongoose";
import { GenderEnum, ProviderEnum } from "src/common/enums/user.enum";
import { generateHash } from './../../common/utils/security/hash.security';
import { OtpDocument } from "./otp.model";
import { RoleEnum } from 'src/common/enums/user.enum';
import { IUser } from "src/common/interfaces/user.interface";

@Schema({
  strictQuery: true,
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true},
})
export class User implements IUser {
  @Prop({
    type:String,
    required:true,
    minLength:2,
    maxLength:50,
    trim:true,
  })
  firstName: string;

  @Prop({
    type:String,
    required:true,
    minLength:2,
    maxLength:50,
    trim:true,
  })
  lastName: string;

  @Virtual({
    get:function(this:User){
      return this.firstName + " " + this.lastName
    },
    set:function(value:string){
      const [firstName, lastName] = value.split(" ") || [];
      this.set({firstName, lastName})
    },
  })
  username:string;

  @Prop({
    type:String,
    required:true,
    unique:true,
  })
  email: string;
  
  @Prop({
    type:String,
    required: function(this:User){
      this.provider === ProviderEnum.google ? false : true;
    },
  })
  password: string;

  @Prop({
    type:String,
    required:false,
  })
  resetPasswordOtp?: string;
  
  @Prop({ type: String })
  profilePicture: string;
  
  @Prop({
    type: String,
    enum: RoleEnum,
    default: RoleEnum.user,
  })
  role: RoleEnum;
  
  @Prop({
    type: String,
    enum: ProviderEnum,
    default: ProviderEnum.system,
  })
  provider: ProviderEnum;
  
  @Prop({
    type: String,
    enum: GenderEnum,
    default: GenderEnum.male,
  })
  gender: GenderEnum;

  @Prop({ type: Types.ObjectId, ref: 'User'})
  updatedBy: Types.ObjectId;

  @Prop({type: Date})
  freezedAt: Date;
  @Prop({type: Date})
  restoredAt: Date;


    @Prop({
      type:Date,
      required:false,
    })
    confirmedAt: Date;

  @Prop({
    type:Date,
    required:false,
  })
  changeCredentialsTime: Date;

  @Prop({type:[{type:Types.ObjectId, ref: "Product"}]})  
  wishlist?: Types.ObjectId[];

  @Virtual()
  otp: OtpDocument[];


}

export type UserDocument = HydratedDocument<User>;
const userSchema = SchemaFactory.createForClass(User);

userSchema.virtual('otp', {
  localField: "_id",
  foreignField: "createdBy",
  ref: "Otp",
});

userSchema.pre("save", async function (next){
  if(this.isModified("password")){
    this.password = await generateHash(this.password);
  } 
  next();
})

userSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate() as UpdateQuery<UserDocument>;

  // normalize update target (handle both direct and $set forms)
  const $set = (update.$set ?? update) as any;

  if ($set.username) {
    const [firstName, ...rest] = String($set.username).split(' ');
    const lastName = rest.join(' ') || '';
    // ensure we write to $set.firstName/lastName
    const newUpdate = {
      ...(update),
      $set: {
        ...(update.$set || {}),
        firstName,
        lastName,
      },
    };
    // remove original username field (either top-level or inside $set)
    if (newUpdate.$set && newUpdate.$set.username) delete newUpdate.$set.username;
    if ((newUpdate as any).username) delete (newUpdate as any).username;

    this.setUpdate(newUpdate);
  }

  const query = this.getQuery();
  if (query.paranoId === false) {
    // keep as-is
    return next();
  }
  // add freeze filter without overwriting other conditions
  this.where({ freezedAt: { $exists: false } });

  next();
});

userSchema.pre(['find', 'findOne'], function (next) {
  const query = this.getQuery();
  if (query.paranoId !== false) {
    // add freeze filter without clobbering other conditions
    this.where({ freezedAt: { $exists: false } });
  }
  next();
});


export const UserModel = MongooseModule.forFeature([
  {name: User.name, schema: userSchema}
]);