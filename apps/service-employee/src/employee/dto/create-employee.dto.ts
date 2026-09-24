import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255)
  email!: string;

  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  @MaxLength(255)
  fullName!: string;

  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, { message: 'Please provide a valid mobile number' })
  mobile!: string;

  @IsNotEmpty({ message: 'Salary package is required' })
  @IsString()
  salaryPackageId!: string; // Placeholder until Epic 3 Salary Configuration is available
}
