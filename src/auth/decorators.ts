import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPrincipal } from './UserPrincipal';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserPrincipal => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
