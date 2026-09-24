import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from '../database/organization.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrganization', () => {
    it('should return organization if exists', async () => {
      const org = { id: '1', name: 'Org 1', code: 'ORG1' };
      mockRepository.find.mockResolvedValue([org]);
      const result = await service.getOrganization();
      expect(result).toEqual(org);
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      mockRepository.find.mockResolvedValue([]);
      await expect(service.getOrganization()).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveOrganization', () => {
    it('should create new organization if it does not exist', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.findOne.mockResolvedValue(null);
      const newOrg = { id: '1', name: 'Org 1', code: 'ORG1', contactEmail: 'test@test.com' };
      mockRepository.create.mockReturnValue(newOrg);
      mockRepository.save.mockResolvedValue(newOrg);

      const result = await service.saveOrganization({ name: 'Org 1', code: 'ORG1', contactEmail: 'test@test.com' });
      expect(result).toEqual(newOrg);
      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'Org 1', code: 'ORG1', contactEmail: 'test@test.com' });
      expect(mockRepository.save).toHaveBeenCalledWith(newOrg);
    });

    it('should update organization if it exists', async () => {
      const existingOrg = { id: '1', name: 'Org 1', code: 'ORG1', contactEmail: 'test@test.com' };
      mockRepository.find.mockResolvedValue([existingOrg]);

      const updateDto = { name: 'Org Updated', code: 'ORG1' };
      mockRepository.save.mockResolvedValue({ ...existingOrg, ...updateDto });

      const result = await service.saveOrganization(updateDto);
      expect(result.name).toEqual('Org Updated');
      expect(mockRepository.save).toHaveBeenCalledWith({ ...existingOrg, ...updateDto });
    });

    it('should throw ConflictException if organization code exists', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.findOne.mockResolvedValue({ id: '2', code: 'ORG1' });

      await expect(service.saveOrganization({ name: 'Org 1', code: 'ORG1', contactEmail: 'test@test.com' }))
        .rejects.toThrow(ConflictException);
    });
  });
});
