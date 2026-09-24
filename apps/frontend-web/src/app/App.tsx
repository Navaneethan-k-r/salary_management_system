import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { AppThemeProvider } from '../theme/ThemeProvider';
import { store } from '../store';
import { LoginPage } from '../pages/LoginPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { Dashboard } from '../pages/admin/Dashboard';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { OrganizationProfilePage } from '../pages/OrganizationProfilePage';
import EmployeeDirectoryPage from '../pages/EmployeeDirectoryPage';

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
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="organization" element={<OrganizationProfilePage />} />
              <Route path="employees" element={<EmployeeDirectoryPage />} />
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
