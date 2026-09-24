import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../database/employee.entity';
import { EmployeeListDto, PaginatedResponseDto } from '@salary-mgmt/shared-types';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private employeeRepository: Repository<EmployeeEntity>,
  ) {}

  private toDto(e: EmployeeEntity): EmployeeListDto {
    return {
      id: e.id,
      email: e.email,
      fullName: e.fullName,
      mobile: e.mobile,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }

  async getEmployees(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'fullName',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<PaginatedResponseDto<EmployeeListDto>> {
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee')
      .where('employee.organizationId = :organizationId', { organizationId })
      .andWhere('employee.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(employee.fullName LIKE :search OR employee.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy(`employee.${sortBy}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map(e => this.toDto(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createEmployee(
    organizationId: string,
    dto: CreateEmployeeDto,
  ): Promise<EmployeeListDto> {
    // Check for duplicate email within the same organization
    const existing = await this.employeeRepository.findOne({
      where: { email: dto.email.trim().toLowerCase(), organizationId },
    });
    if (existing) {
      throw new ConflictException('Email already registered.');
    }

    const employee = this.employeeRepository.create({
      email: dto.email.trim().toLowerCase(),
      fullName: dto.fullName.trim(),
      mobile: dto.mobile.trim(),
      organizationId,
      status: 'pending_onboarding',
    });

    const saved = await this.employeeRepository.save(employee);
    return this.toDto(saved);
  }

  async updateEmployee(
    id: string,
    organizationId: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeListDto> {
    const employee = await this.employeeRepository.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with id "${id}" not found.`);
    }

    if (dto.fullName !== undefined) employee.fullName = dto.fullName.trim();
    if (dto.mobile !== undefined) employee.mobile = dto.mobile.trim();
    // salaryPackageId is accepted but not persisted in this entity (Epic 3 placeholder)

    const saved = await this.employeeRepository.save(employee);
    return this.toDto(saved);
  }

  async deleteEmployee(
    id: string,
    organizationId: string,
  ): Promise<void> {
    const employee = await this.employeeRepository.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with id "${id}" not found.`);
    }

    // Soft delete: mark as inactive and record the deletion timestamp
    employee.isActive = false;
    employee.deletedAt = new Date();
    await this.employeeRepository.save(employee);
  }
}
