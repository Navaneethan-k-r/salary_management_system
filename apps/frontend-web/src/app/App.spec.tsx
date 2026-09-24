import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import App from './App';
import { theme, designTokens } from '../theme/theme';

describe('App component', () => {
  it('renders application and redirects to login by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
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
});
