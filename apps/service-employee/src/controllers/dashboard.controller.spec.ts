import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { AuthGuard } from '../auth/auth.guard';
import { describe, beforeEach, it, expect } from 'vitest';

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardMetrics', () => {
    it('should return initial metrics with 0 totalEmployees and empty recentPayrollRuns', () => {
      const result = controller.getDashboardMetrics();
      expect(result).toEqual({
        totalEmployees: 0,
        recentPayrollRuns: [],
      });
    });
  });
});
