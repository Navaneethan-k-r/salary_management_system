import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hr_admins')
export class HrAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;
}
