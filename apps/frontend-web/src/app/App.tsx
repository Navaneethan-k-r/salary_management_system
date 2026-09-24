import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { AppThemeProvider } from '../theme/ThemeProvider';
import { store } from '../store';
import { LoginPage } from '../pages/LoginPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminDashboardPlaceholder } from '../pages/AdminDashboardPlaceholder';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPlaceholder />} />
              <Route path="employees" element={<div>Employees Page (Not Implemented)</div>} />
              <Route path="salary-config" element={<div>Salary Config (Not Implemented)</div>} />
              <Route path="payslips" element={<div>Payslips (Not Implemented)</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AppThemeProvider>
    </Provider>
  );
};

export default App;
