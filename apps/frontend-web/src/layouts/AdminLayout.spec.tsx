import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import { AdminLayout } from './AdminLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

const createTestStore = (isAuthenticated = true) => {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        isAuthenticated,
        session: null,
        isLoading: false,
        error: null
      }
    }
  });
};

describe('AdminLayout & ProtectedRoute', () => {
  it('renders sidebar navigation items when authenticated', () => {
    const store = createTestStore(true);
    render(
      <Provider store={store}>
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('HR Administration')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Salary Config')).toBeInTheDocument();
    expect(screen.getByText('Payslips')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated accessing protected route', () => {
    const store = createTestStore(false);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Should redirect to login
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('HR Administration')).not.toBeInTheDocument();
  });

  it('allows access to protected route when authenticated', () => {
    const store = createTestStore(true);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.getByText('HR Administration')).toBeInTheDocument();
  });
});
