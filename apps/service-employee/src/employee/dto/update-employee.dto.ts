import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, { message: 'Please provide a valid mobile number' })
  mobile?: string;

  @IsOptional()
  @IsString()
  salaryPackageId?: string; // Placeholder until Epic 3 Salary Configuration is available
}
