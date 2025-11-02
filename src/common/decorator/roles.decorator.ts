import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from 'src/common/enums/user.enum';

export const roleName = "roles";
export const Roles = (acessRoles:RoleEnum[]) => {
  return SetMetadata(roleName, acessRoles)
};