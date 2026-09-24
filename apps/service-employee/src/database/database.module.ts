import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrAdmin } from './hr-admin.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root', // Assumed defaults for local development
      password: 'password',
      database: 'salary_management',
      entities: [HrAdmin],
      synchronize: false, // Use migrations instead
    }),
    TypeOrmModule.forFeature([HrAdmin]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
