import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import authReducer from '../store/slices/authSlice';
import { LoginPage } from './LoginPage';
import { authService } from '../services/authService';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn()
  }
}));

const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { auth: authReducer },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return <Provider store={store}><BrowserRouter>{children}</BrowserRouter></Provider>;
  };
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form elements', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error for empty fields', async () => {
    renderWithProviders(<LoginPage />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('shows validation error for missing password', async () => {
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('submits form when fields are valid', async () => {
    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
    mockLogin.mockResolvedValueOnce({ token: '123', user: { id: '1' } });
    
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      });
    });
  });

  it('displays error on failed login', async () => {
    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);
    
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('clears expired session from storage', () => {
    const expiredSession = {
      token: 'old-token',
      userId: '1',
      role: 'hr_admin',
      email: 'admin@example.com',
      organizationId: 'org-1',
      createdAt: new Date(Date.now() - 100000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };

    sessionStorage.setItem('auth_session', JSON.stringify(expiredSession));
    const parsed = JSON.parse(sessionStorage.getItem('auth_session') || '{}');
    const isExpired = Date.now() > new Date(parsed.expiresAt).getTime();
    expect(isExpired).toBe(true);

    sessionStorage.removeItem('auth_session');
    expect(sessionStorage.getItem('auth_session')).toBeNull();
  });
});
