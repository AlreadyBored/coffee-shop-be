import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    // Always allow the request to proceed, but try to authenticate if possible
    const result = super.canActivate(context);

    if (result instanceof Promise) {
      return result.then(() => true).catch(() => true);
    }

    // If it's not a Promise, just return true (allow the request)
    return true;
  }
}
