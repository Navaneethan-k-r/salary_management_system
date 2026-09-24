import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller(['employee/dashboard', 'dashboard'])
@UseGuards(AuthGuard)
export class DashboardController {
  @Get('metrics')
  getDashboardMetrics() {
    return {
      totalEmployees: 0,
      recentPayrollRuns: [],
    };
  }
}
