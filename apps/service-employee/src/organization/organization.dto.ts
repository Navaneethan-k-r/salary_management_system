import { IsString, IsEmail, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { CreateOrganizationProfileDto, UpdateOrganizationProfileDto } from '@salary-mgmt/shared-types';

export class CreateOrganizationDto implements CreateOrganizationProfileDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Code must be alphanumeric' })
  code!: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail!: string;
}

export class UpdateOrganizationDto implements UpdateOrganizationProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Code must be alphanumeric' })
  code?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
