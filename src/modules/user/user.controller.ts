import { TokenEnum } from 'src/common/enums/token.enum';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UseInterceptors,
  Param, 
  Delete,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';

import { RoleEnum } from 'src/common/enums/user.enum';

import { UserService } from './user.service';
import { User } from 'src/common/decorator/credential.decorator';
import type { UserDocument } from 'src/DB/models/user.model';

import { FileInterceptor} from '@nestjs/platform-express';
import { fileValidation } from './../../common/utils/multer/validation.multer';
import { cloudFileUpload } from './../../common/utils/multer/cloud.multer.options';

import { StorageEnum } from 'src/common/enums/multer.enum';

import type { IUser } from 'src/common/interfaces/user.interface';

import type { IResponse } from 'src/common/interfaces/response.interface';
import { successResponse } from './../../common/utils/response';

import { UserParamsDto } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth([RoleEnum.admin, RoleEnum.user, RoleEnum.superAdmin])
  @Get()
  async profile(@User() user: UserDocument): Promise<IResponse<IUser>> {
    const profile = await this.userService.profile(user)
    return successResponse<IUser>({ data: profile });
  }

  @Auth([RoleEnum.admin, RoleEnum.user, RoleEnum.superAdmin], TokenEnum.refresh)
  @Get('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @User() user: UserDocument,

  ): Promise<IResponse<{credentials: {access_token: string; refresh_token: string}}>> {
    const credentials = await this.userService.refreshToken(user);
    return successResponse<{credentials: {access_token: string; refresh_token: string}}> ({message: 'token refreshed successfully', data: {credentials}});
  }
 
  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      cloudFileUpload({
        storageApproach: StorageEnum.disk,
        validation: fileValidation.image,
        fileSize: 2,
      }),
    ),
  )
  @Auth([RoleEnum.admin, RoleEnum.user, RoleEnum.superAdmin])
  @Patch('profile-image')
  async profileImage(
    @User() user: UserDocument,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<{profile: Partial<IUser>}>> {
    const profile = await this.userService.profileImage(file, user);
    return successResponse<{profile: Partial<IUser>}>({data: {profile}});
  }
  
  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Delete(':userId/freeze')
  async freeze(
    @Param() params: UserParamsDto, 
    @User() user: UserDocument,
  ): Promise<IResponse> {
    await this.userService.freeze(params.userId, user);
    return successResponse({status:204})
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Delete(':userId/delete')
  async delete(
    @Param() params: UserParamsDto, 
  ): Promise<IResponse> {
    await this.userService.delete(params.userId);
    return successResponse()
  }

  @Auth([RoleEnum.admin, RoleEnum.superAdmin])
  @Patch(':userId/restore')
  async restore(
    @Param() params: UserParamsDto, 
    @User() user: UserDocument,
  ): Promise<IResponse<{profile: Partial<IUser>}>> {
    const profile = await this.userService.restore(params.userId, user);
    return successResponse<{profile: Partial<IUser>}>({data:{profile}})
  }
  

}
