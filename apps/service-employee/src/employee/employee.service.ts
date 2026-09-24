import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../database/employee.entity';
import { EmployeeListDto, PaginatedResponseDto } from '@salary-mgmt/shared-types';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async getEmployees(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'fullName',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<PaginatedResponseDto<EmployeeListDto>> {
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee')
      .where('employee.organizationId = :organizationId', { organizationId });

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

    const data = entities.map(e => ({
      id: e.id,
      email: e.email,
      fullName: e.fullName,
      mobile: e.mobile,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
