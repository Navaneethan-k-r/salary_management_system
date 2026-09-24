import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OrganizationModule } from '../organization/organization.module';
import { DashboardController } from '../controllers/dashboard.controller';

@Module({
  imports: [AuthModule, DatabaseModule, OrganizationModule],
  controllers: [DashboardController],
  providers: [],
})
export class AppModule {}
