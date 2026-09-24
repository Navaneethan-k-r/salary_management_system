import { LoginCredentialsDto, AuthResponseDto } from '@salary-mgmt/shared-types';

export type LoginRequest = LoginCredentialsDto;

class AuthService {
  private baseUrl = '/api/auth';
  private useMock = false; // Connect to real NestJS backend

  async login(credentials: LoginRequest): Promise<AuthResponseDto> {
    if (this.useMock) {
      return this.mockLogin(credentials);
    }

    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    return result as AuthResponseDto;
  }

  async logout(): Promise<void> {
    if (this.useMock) {
      return new Promise(resolve => setTimeout(resolve, 300));
    }

    const sessionData = sessionStorage.getItem('auth_session');
    let token = '';
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        token = parsed.token;
      } catch (e) {}
    }

    const response = await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Logout failed on server');
    }
  }

  private mockLogin(credentials: LoginRequest): Promise<AuthResponseDto> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email === 'admin@salarymgmt.com' && credentials.password === 'admin123') {
          resolve({
            token: 'mock123token',
            user: {
              id: 'admin-1',
              email: 'admin@salarymgmt.com',
              fullName: 'Admin User',
              role: 'hr_admin'
            }
          });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500);
    });
  }
}

export const authService = new AuthService();
