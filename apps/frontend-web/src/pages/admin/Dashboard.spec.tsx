import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Dashboard Component', () => {
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    global.fetch = mockFetch;
    Storage.prototype.getItem = vi.fn(() => 'test-token');
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    
    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(screen.getByTestId('employee-loading-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('payroll-loading-skeleton')).toBeInTheDocument();
  });

  it('renders populated state successfully', async () => {
    const mockData = {
      totalEmployees: 42,
      recentPayrollRuns: [
        { id: '1', date: '2026-09-01', totalAmount: 500000, status: 'Completed' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
    
    expect(screen.getByText('2026-09-01')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    
    const row = screen.getByText(/5,00,000|500,000/i);
    expect(row).toBeInTheDocument();
  });

  it('renders empty state successfully', async () => {
    const mockData = {
      totalEmployees: 0,
      recentPayrollRuns: []
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
    
    expect(screen.getByText('No recent payroll runs.')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('allows retrying after error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    const mockData = {
      totalEmployees: 10,
      recentPayrollRuns: []
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);
    
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });
});
