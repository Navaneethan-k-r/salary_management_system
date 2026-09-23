import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import App, { AppContent } from './App';
import { theme, designTokens } from '../theme/theme';
import { AppThemeProvider } from '../theme/ThemeProvider';

describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
  it('renders application with global theme provider and heading', () => {
    render(<App />);
    expect(screen.getByText(/Foundation & UI Theme Initialized/i)).toBeInTheDocument();
    expect(screen.getByTestId('app-bar')).toBeInTheDocument();
  });

  it('verifies custom theme tokens adhere strictly to DESIGN.md', () => {
    expect(theme.palette.primary.main).toBe('#1976d2');
    expect(theme.palette.background.default).toBe('#f4f6f8');
    expect(theme.palette.background.paper).toBe('#ffffff');
    expect(theme.palette.text.primary).toBe('#111827');
    expect(theme.palette.text.secondary).toBe('#6b7280');
    expect(theme.shape.borderRadius).toBe(8);
    expect(designTokens.borderRadius.card).toBe(12);
    expect(designTokens.borderRadius.button).toBe(6);
    expect(theme.typography.fontFamily).toContain('Inter');
    expect(theme.typography.fontFamily).toContain('Roboto');
  });

  it('renders theme tokens in the UI preview card', () => {
    render(
      <AppThemeProvider>
        <AppContent />
      </AppThemeProvider>
    );

    const primaryColorText = screen.getByText('#1976d2');
    expect(primaryColorText).toBeInTheDocument();

    const bgDefaultText = screen.getByText('#f4f6f8');
    expect(bgDefaultText).toBeInTheDocument();

    const borderRadiusText = screen.getByText('8px');
    expect(borderRadiusText).toBeInTheDocument();
  });

  it('successfully consumes models from @salary-mgmt/shared-types', () => {
    render(<App />);
    expect(screen.getByText(/ACME Technologies Pvt Ltd/i)).toBeInTheDocument();
    expect(screen.getByText(/₹ INR/i)).toBeInTheDocument();
    expect(screen.getByText(/HR Administrator/i)).toBeInTheDocument();
  });
});
