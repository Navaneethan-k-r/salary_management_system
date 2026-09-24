import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    if (!body || !body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    
    const token = await this.authService.validateUser(body.email, body.password);
    
    if (!token) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return { token };
  }
}
