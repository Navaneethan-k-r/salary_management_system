import axios from 'axios';
import { PaginatedResponseDto, EmployeeListDto } from '@salary-mgmt/shared-types';

const API_URL = '/api/employees';

const getAuthHeaders = () => {
  const sessionData = sessionStorage.getItem('auth_session');
  if (sessionData) {
    try {
      const parsed = JSON.parse(sessionData);
      if (parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` };
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return {};
};

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const employeeService = {
  async getEmployees(params?: GetEmployeesParams): Promise<PaginatedResponseDto<EmployeeListDto>> {
    const response = await axios.get<PaginatedResponseDto<EmployeeListDto>>(API_URL, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  }
};
