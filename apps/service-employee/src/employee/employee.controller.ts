import {
  Controller, Get, Post, Put, Body, Param, Query,
  Req, UseGuards, DefaultValuePipe, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
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
      sortOrder,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEmployee(
    @Req() req: Request,
    @Body() dto: CreateEmployeeDto,
  ) {
    const session = req.user as any;
    return this.employeeService.createEmployee(session.organizationId, dto);
  }

  @Put(':id')
  async updateEmployee(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const session = req.user as any;
    return this.employeeService.updateEmployee(id, session.organizationId, dto);
  }
}
