import { Controller, Get, Query, Req, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('employees')
@UseGuards(AuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  async getEmployees(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('sortBy', new DefaultValuePipe('fullName')) sortBy?: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder?: 'ASC' | 'DESC',
  ) {
    const session = req.user as any;
    return this.employeeService.getEmployees(
      session.organizationId,
      page,
      limit,
      search,
      sortBy,
      sortOrder
    );
  }
}
