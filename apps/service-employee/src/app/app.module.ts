import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OrganizationModule } from '../organization/organization.module';
import { EmployeeModule } from '../employee/employee.module';
import { DashboardController } from '../controllers/dashboard.controller';

@Module({
  imports: [AuthModule, DatabaseModule, OrganizationModule, EmployeeModule],
  controllers: [DashboardController],
  providers: [],
})
export class AppModule {}
