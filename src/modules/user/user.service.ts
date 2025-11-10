import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDocument } from 'src/DB/models/user.model';
import { S3Service } from './../../common/services/s3.service';
import { TokenService } from 'src/common/utils/security/token.security';
import { StorageEnum } from 'src/common/enums/multer.enum';
import { Types } from 'mongoose';
import { UserRepository } from 'src/DB/repository/user.repository';
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/common/enums/user.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async profile(user: UserDocument): Promise<UserDocument> {
    const profile = await this.userRepository.findOne({filter:{_id:user._id}, options:{populate:[{path:"wishlist"}]}}) as UserDocument;  
    return profile;
  }

  async refreshToken(
    user: UserDocument,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return await this.tokenService.createLoginCredentials(user);
  }

  async profileImage(
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<{ email: string; username: string; profilePicture?: string }> {
    user.profilePicture = await this.s3Service.uploadFile({
      file,
      storageApproach: StorageEnum.disk,
      path: `user/${user._id.toString()}`,
    });
    await user.save();
    const { email, username, profilePicture } = user;
    return { email, username, profilePicture };
  }

  async freeze(UserId: Types.ObjectId, user: UserDocument): Promise<string> {
    if (
      !(await this.userRepository.findOneAndUpdate({
        filter: { _id: UserId },
        update: {
          updatedBy: user._id,
          freezedAt: new Date(),
          $unset: { restoredAt: true },
        },
      }))
    ) {
      throw new NotFoundException('user not found or account is already freezed');
    }

    return 'Done';
  }

  async delete(UserId: Types.ObjectId): Promise<string> {
    const user = await this.userRepository.findOneAndDelete({
      filter: { _id: UserId, paranoId: false, freezedAt: { $exists: true } },
    });

    if (!user) {
      throw new NotFoundException('user not found or account must be freezed first');
    }

    await this.s3Service.deleteFile({ Key: user.profilePicture });

    return 'Done';
  }

  async restore(
    UserId: Types.ObjectId,
    user: UserDocument,
  ): Promise<{
    email: string;
    username: string;
    profilePicture?: string;
    gender: GenderEnum;
    role: RoleEnum;
    provider: ProviderEnum;
  }> {
    const restoredUser = await this.userRepository.findOneAndUpdate({
      filter: { _id: UserId, paranoId: false, freezedAt: { $exists: true } },
      update: {
        updatedBy: user._id,
        restoredAt: new Date(),
        $unset: { freezedAt: true },
      },
    });

    if (!restoredUser) {
      throw new NotFoundException('user not found or account is not freezed');
    }

    const { email, username, profilePicture, gender, role, provider } =
      restoredUser;

    return { email, username, profilePicture, gender, role, provider };
  }
}
