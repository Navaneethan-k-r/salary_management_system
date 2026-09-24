import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import organizationReducer from '../store/slices/organizationSlice';
import { OrganizationProfilePage } from './OrganizationProfilePage';
import { organizationService } from '../services/organizationService';

vi.mock('../services/organizationService');

const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { organization: organizationReducer },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store}>{children}</Provider>;
  };
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

describe('OrganizationProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    const { container } = renderWithProviders(<OrganizationProfilePage />, {
      preloadedState: {
        organization: { loading: true, profile: null, error: null, saveStatus: 'idle' }
      }
    });
    // Find skeletons (MUI standard class)
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders form with existing data', async () => {
    (organizationService.getOrganizationProfile as any).mockResolvedValue({
      id: '1', name: 'Test Org', code: 'TEST1', contactEmail: 'test@org.com', currency: 'INR'
    });

    renderWithProviders(<OrganizationProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Org')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TEST1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@org.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('INR (₹) - Indian Rupee')).toBeDisabled();
    });
  });

  it('validates empty fields on submit', async () => {
    (organizationService.getOrganizationProfile as any).mockRejectedValue({ response: { status: 404 } });
    
    renderWithProviders(<OrganizationProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/Initial setup required/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    expect(screen.getByText('Organization name is required')).toBeInTheDocument();
    expect(screen.getByText('Organization code is required')).toBeInTheDocument();
    expect(screen.getByText('Contact email is required')).toBeInTheDocument();
    expect(organizationService.saveOrganizationProfile).not.toHaveBeenCalled();
  });

  it('submits successfully and shows snackbar', async () => {
    (organizationService.getOrganizationProfile as any).mockRejectedValue({ response: { status: 404 } });
    (organizationService.saveOrganizationProfile as any).mockResolvedValue({
      id: '1', name: 'New Org', code: 'NEW1', contactEmail: 'new@org.com', currency: 'INR'
    });

    renderWithProviders(<OrganizationProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/Initial setup required/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Organization Name/i), { target: { value: 'New Org' } });
    fireEvent.change(screen.getByLabelText(/Organization Code/i), { target: { value: 'NEW1' } });
    fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'new@org.com' } });

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(organizationService.saveOrganizationProfile).toHaveBeenCalledWith({
        name: 'New Org',
        code: 'NEW1',
        contactEmail: 'new@org.com'
      });
      expect(screen.getByText('Organization profile saved successfully')).toBeInTheDocument();
    });
  });
});
