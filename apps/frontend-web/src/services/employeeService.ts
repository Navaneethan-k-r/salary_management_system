import axios from 'axios';
import { PaginatedResponseDto, EmployeeListDto, CreateEmployeeDto, UpdateEmployeeDto } from '@salary-mgmt/shared-types';

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
  },

  async createEmployee(dto: CreateEmployeeDto): Promise<EmployeeListDto> {
    const response = await axios.post<EmployeeListDto>(API_URL, dto, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<EmployeeListDto> {
    const response = await axios.put<EmployeeListDto>(`${API_URL}/${id}`, dto, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
