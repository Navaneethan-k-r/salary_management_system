import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeEntity } from '../database/employee.entity';

const mockRepo = {
  createQueryBuilder: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
};

const makeEntity = (overrides = {}): EmployeeEntity => ({
  id: 'emp-1',
  email: 'alice@example.com',
  fullName: 'Alice Smith',
  mobile: '+91 9876543210',
  organizationId: 'org-1',
  status: 'pending_onboarding',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
} as EmployeeEntity);

describe('EmployeeService — createEmployee', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: getRepositoryToken(EmployeeEntity), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<EmployeeService>(EmployeeService);
  });

  it('creates and returns a new employee when email is unique', async () => {
    // I/O Matrix: Add New Employee — valid email, mobile, salary components
    mockRepo.findOne.mockResolvedValue(null); // no duplicate
    const saved = makeEntity();
    mockRepo.create.mockReturnValue(saved);
    mockRepo.save.mockResolvedValue(saved);

    const result = await service.createEmployee('org-1', {
      email: 'alice@example.com',
      fullName: 'Alice Smith',
      mobile: '+91 9876543210',
      salaryPackageId: 'pkg-mid',
    });

    expect(result.id).toBe('emp-1');
    expect(result.email).toBe('alice@example.com');
    expect(result.status).toBe('pending_onboarding');
  });

  it('throws ConflictException when email is already registered', async () => {
    // I/O Matrix: Duplicate Email — Email already exists in DB
    mockRepo.findOne.mockResolvedValue(makeEntity());

    await expect(
      service.createEmployee('org-1', {
        email: 'alice@example.com',
        fullName: 'Alice Smith',
        mobile: '+91 9876543210',
        salaryPackageId: 'pkg-mid',
      }),
    ).rejects.toThrow(ConflictException);

    await expect(
      service.createEmployee('org-1', {
        email: 'alice@example.com',
        fullName: 'Alice Smith',
        mobile: '+91 9876543210',
        salaryPackageId: 'pkg-mid',
      }),
    ).rejects.toThrow('Email already registered.');
  });
});

describe('EmployeeService — updateEmployee', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: getRepositoryToken(EmployeeEntity), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<EmployeeService>(EmployeeService);
  });

  it('updates mobile and returns the updated employee', async () => {
    // I/O Matrix: Edit Employee — valid updated mobile number
    const existing = makeEntity();
    mockRepo.findOne.mockResolvedValue(existing);
    const updated = makeEntity({ mobile: '+91 1111111111' });
    mockRepo.save.mockResolvedValue(updated);

    const result = await service.updateEmployee('emp-1', 'org-1', {
      mobile: '+91 1111111111',
    });

    expect(result.mobile).toBe('+91 1111111111');
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });

  it('throws NotFoundException when employee does not exist', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateEmployee('missing-id', 'org-1', { mobile: '+91 9999999999' }),
    ).rejects.toThrow(NotFoundException);
  });
});
