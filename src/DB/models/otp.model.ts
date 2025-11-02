import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OtpEnum } from 'src/common/enums/otp.enum';

import { generateHash } from 'src/common/utils/security/hash.security';

import { emailEvent } from './../../common/utils/email/email.event';
import { IOtp } from 'src/common/interfaces/otp.interface';

@Schema({ timestamps: true })
export class Otp implements IOtp {
  @Prop({ type: String, required: true })
  otp: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: String, enum: OtpEnum, required: true })
  type: OtpEnum;
}

export type OtpDocument = HydratedDocument<Otp>;
const otpSchema = SchemaFactory.createForClass(Otp);

otpSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.pre(
  'save',
  async function (
    this: OtpDocument & { wasNew: boolean; plainOtp?: string },
    next,
  ) {
    this.wasNew = this.isNew;
    if(this.isModified('otp')){
      this.plainOtp = this.otp;
      this.otp = await generateHash(this.otp);
      await this.populate([{path: 'createdBy', select: 'email'}]);
    }
    next();
  },
);

otpSchema.post('save', async function(doc, next){
  const that = this as OtpDocument & { wasNew: boolean; plainOtp?: string };

  if(that.wasNew && that.plainOtp){
    emailEvent.emit(doc.type, {
      to: (that.createdBy as any).email,
      otp: that.plainOtp,
    });
  }

  next();
})

export const OtpModel = MongooseModule.forFeature([
  { name: Otp.name, schema: otpSchema },
]);
