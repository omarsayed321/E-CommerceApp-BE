import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { TokenService } from './../../utils/security/token.security';
import { TokenEnum } from 'src/common/enums/token.enum';
import { tokenName } from 'src/common/decorator/token.type.decorator';

import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly tokenService:TokenService,
    private readonly reflector:Reflector,

  ){}
  async canActivate(context: ExecutionContext,):Promise<boolean> {

    const tokenType: TokenEnum = this.reflector.getAllAndOverride<TokenEnum>(
      tokenName,
      [context.getHandler(),context.getClass()],
    ) ?? TokenEnum.access;

    let req:any;
    let authorization: string = "";
    switch (context.getType()) {
      case "http":
        const httpCtx = context.switchToHttp();
        req = httpCtx.getRequest();
        authorization = req.headers.authorization;
        break;
      // case "rpc":
      //   const httpRpc = context.switchToRpc();
      //   break;
      // case "ws":
      //   const httpWs = context.switchToWs();
      //   break;
      default:
        break;
    }

    const {decoded, user} = await this.tokenService.decodedToken({
      authorization,
      tokenType,
    });
    req.credentials = {decoded, user};

    return true;
  }
}
