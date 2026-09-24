import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrAdmin } from './hr-admin.entity';
import { Organization } from './organization.entity';
import { EmployeeEntity } from './employee.entity';
import { ActivationTokenEntity } from './activation-token.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'rootpassword',
      database: process.env.DB_DATABASE || 'salary_management',
      entities: [HrAdmin, Organization, EmployeeEntity, ActivationTokenEntity],
      synchronize: false, // Always false in production; migrations manage schema changes
      logging: ['error', 'warn'],
      extra: {
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      },
    }),
    TypeOrmModule.forFeature([HrAdmin, Organization, EmployeeEntity, ActivationTokenEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
