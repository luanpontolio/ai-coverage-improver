import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const sessionUser = request.session?.user;
    if (!sessionUser) {
      throw new UnauthorizedException('Authentication required');
    }
    request.user = sessionUser;
    return true;
  }
}

