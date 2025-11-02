import { applyDecorators, UseGuards } from "@nestjs/common";

import { Token } from "./token.type.decorator";
import { TokenEnum } from "../enums/token.enum";

import { Roles } from "./roles.decorator";
import { RoleEnum } from "../enums/user.enum";

import { AuthenticationGuard } from "../guards/authentication/authentication.guard";
import { AuthorizationGuard } from "../guards/authorization/authorization.guard";

export function Auth(roles: RoleEnum[], type: TokenEnum = TokenEnum.access){
  return applyDecorators(
    Token(type),
    Roles(roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard),

  )
}