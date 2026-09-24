import { DataSource } from 'typeorm';
import { HrAdmin } from './src/database/hr-admin.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'salary_management',
  synchronize: false,
  logging: true,
  entities: [HrAdmin],
  migrations: ['./migrations/*.ts'],
  subscribers: [],
});
