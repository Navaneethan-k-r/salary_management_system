import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { AuthGuard } from '../auth/auth.guard';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let mockOrganizationService: any;

  beforeEach(async () => {
    mockOrganizationService = {
      getOrganization: vi.fn(),
      saveOrganization: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOrganization', () => {
    it('should return organization profile from service', async () => {
      const mockOrg = { id: '1', name: 'ACME', code: 'abt2026', contactEmail: 'acme@gmail.com' };
      mockOrganizationService.getOrganization.mockResolvedValue(mockOrg);

      const result = await controller.getOrganization();
      expect(result).toEqual(mockOrg);
      expect(mockOrganizationService.getOrganization).toHaveBeenCalled();
    });
  });

  describe('saveOrganization', () => {
    it('should pass DTO to service and return updated profile', async () => {
      const dto = { name: 'ACME', code: 'abt2026', contactEmail: 'acme@gmail.com' };
      const savedOrg = { id: '1', ...dto, currency: 'INR' };
      mockOrganizationService.saveOrganization.mockResolvedValue(savedOrg);

      const result = await controller.saveOrganization(dto);
      expect(result).toEqual(savedOrg);
      expect(mockOrganizationService.saveOrganization).toHaveBeenCalledWith(dto);
    });
  });
});
