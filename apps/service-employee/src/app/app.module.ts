import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [AuthModule, DatabaseModule, OrganizationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
