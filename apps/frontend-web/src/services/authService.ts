import { LoginCredentialsDto, AuthResponseDto } from '@salary-mgmt/shared-types';

export type LoginRequest = LoginCredentialsDto;

class AuthService {
  // Use VITE_API_BASE_URL if configured, otherwise default to relative path '/api/auth' (handled by reverse proxy/Vite proxy)
  private get baseUrl(): string {
    const configuredBase = import.meta.env.VITE_API_BASE_URL;
    return configuredBase ? `${configuredBase.replace(/\/$/, '')}/api/auth` : '/api/auth';
  }

  async login(credentials: LoginRequest): Promise<AuthResponseDto> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result as AuthResponseDto;
  }

  async logout(): Promise<void> {
    const sessionData = sessionStorage.getItem('auth_session');
    let token = '';
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        token = parsed.token || '';
      } catch {
        // Ignore session parse error on logout
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('Logout endpoint responded with status:', response.status);
      }
    } catch (err) {
      console.warn('Failed to reach logout endpoint:', err);
    }
  }
}

export const authService = new AuthService();
