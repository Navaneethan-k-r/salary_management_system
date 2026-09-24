import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('employees')
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', length: 20 })
  mobile!: string;

  @Column({ name: 'organization_id', type: 'varchar', length: 36 })
  organizationId!: string;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'pending_onboarding'], default: 'pending_onboarding' })
  status!: 'active' | 'inactive' | 'pending_onboarding';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
