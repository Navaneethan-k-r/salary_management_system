import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EmployeeEntity } from './employee.entity';

/**
 * Stores stateful activation tokens for first-time employee onboarding.
 * A token is generated when an employee is created and consumed when they
 * set up their password. Expired or used tokens are rejected.
 */
@Entity('employee_activation_tokens')
export class ActivationTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'varchar', length: 36 })
  employeeId!: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true, default: null })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
