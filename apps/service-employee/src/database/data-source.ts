import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { HrAdmin } from './hr-admin.entity';
import { Organization } from './organization.entity';
import { EmployeeEntity } from './employee.entity';

// Load environment variables from apps/service-employee/.env or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_DATABASE || 'salary_management',
  synchronize: false,
  logging: ['error', 'warn'],
  entities: [HrAdmin, Organization, EmployeeEntity],
  migrations: [path.join(__dirname, '../../migrations/*{.ts,.js}')],
  subscribers: [],
});
