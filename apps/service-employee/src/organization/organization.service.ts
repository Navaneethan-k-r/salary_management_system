import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../database/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from './organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async getOrganization(): Promise<Organization> {
    const orgs = await this.organizationRepository.find({ take: 1 });
    if (!orgs || orgs.length === 0) {
      throw new NotFoundException('Organization not found');
    }
    return orgs[0];
  }

  async saveOrganization(dto: CreateOrganizationDto | UpdateOrganizationDto): Promise<Organization> {
    const orgs = await this.organizationRepository.find({ take: 1 });
    if (orgs.length > 0) {
      const org = orgs[0];
      if (dto.code && dto.code !== org.code) {
        const codeExists = await this.organizationRepository.findOne({ where: { code: dto.code } });
        if (codeExists) {
          throw new ConflictException('Organization code already exists');
        }
      }
      Object.assign(org, dto);
      return this.organizationRepository.save(org);
    } else {
      if (!dto.name || !dto.code || !dto.contactEmail) {
        throw new BadRequestException('Incomplete data for creating organization');
      }
      const existing = await this.organizationRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException('Organization code already exists');
      }
      const newOrg = this.organizationRepository.create(dto);
      return this.organizationRepository.save(newOrg);
    }
  }
}
