export type UserRole = 'hr_admin' | 'employee';

export interface UserSession {
  token: string;
  userId: string;
  role: UserRole;
  email: string;
  organizationId: string;
  createdAt: string;
  expiresAt: string;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  currency: 'INR';
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  organizationId: string;
  status: 'active' | 'inactive' | 'pending_onboarding';
  createdAt: string;
  updatedAt: string;
}

export type SalaryComponentType = 'additive' | 'deductive';

export interface SalaryComponent {
  id: string;
  name: string;
  type: SalaryComponentType;
  amount: number;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginCredentialsDto {
  email: string;
  password?: string;
  token?: string; // For magic links
}

export interface AuthResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

export interface CreateOrganizationProfileDto {
  name: string;
  code: string;
  contactEmail: string;
}

export interface UpdateOrganizationProfileDto {
  name?: string;
  code?: string;
  contactEmail?: string;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeListDto extends Omit<Employee, 'organizationId'> {}
