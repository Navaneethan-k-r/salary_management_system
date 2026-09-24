import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { extractBearerToken, RedisSessionStore } from '@salary-mgmt/shared-auth';
import Redis from 'ioredis';

@Injectable()
export class AuthGuard implements CanActivate {
  private sessionStore: RedisSessionStore;

  constructor() {
    const redisClient = process.env.REDIS_HOST
      ? new Redis({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379', 10) })
      : undefined;
    this.sessionStore = new RedisSessionStore(redisClient);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers['authorization']);

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const session = await this.sessionStore.getSession(token);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = session;
    return true;
  }
}
