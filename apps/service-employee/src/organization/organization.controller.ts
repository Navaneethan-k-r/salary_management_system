import { Controller, Get, Put, Body, UseGuards, Inject } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './organization.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('organization')
@UseGuards(AuthGuard)
export class OrganizationController {
  constructor(
    @Inject(OrganizationService)
    private readonly organizationService: OrganizationService
  ) {}

  @Get()
  async getOrganization() {
    return this.organizationService.getOrganization();
  }

  @Put()
  async saveOrganization(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.saveOrganization(dto);
  }
}
