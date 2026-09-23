import { createTheme } from '@mui/material/styles';

export const designTokens = {
  colors: {
    primary: '#1976d2',
    secondary: '#9c27b0',
    background: '#f4f6f8',
    surface: '#ffffff',
    error: '#d32f2f',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    tableHeaderBg: '#f9fafb',
    hoverRowBg: '#f3f4f6',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  borderRadius: {
    default: 8,
    button: 6,
    card: 12,
  },
  spacing: {
    base: 8,
    container: 24,
    section: 32,
  },
  layout: {
    sidebarWidth: 260,
  },
} as const;

export const theme = createTheme({
  spacing: designTokens.spacing.base,
  shape: {
    borderRadius: designTokens.borderRadius.default,
  },
  palette: {
    primary: {
      main: designTokens.colors.primary,
    },
    secondary: {
      main: designTokens.colors.secondary,
    },
    error: {
      main: designTokens.colors.error,
    },
    background: {
      default: designTokens.colors.background,
      paper: designTokens.colors.surface,
    },
    text: {
      primary: designTokens.colors.textPrimary,
      secondary: designTokens.colors.textSecondary,
    },
    divider: designTokens.colors.border,
  },
  typography: {
    fontFamily: designTokens.typography.fontFamily,
    fontWeightRegular: designTokens.typography.weights.regular,
    fontWeightMedium: designTokens.typography.weights.medium,
    fontWeightBold: designTokens.typography.weights.bold,
    h1: {
      fontWeight: designTokens.typography.weights.bold,
      color: designTokens.colors.textPrimary,
    },
    h2: {
      fontWeight: designTokens.typography.weights.bold,
      color: designTokens.colors.textPrimary,
    },
    h3: {
      fontWeight: designTokens.typography.weights.medium,
      color: designTokens.colors.textPrimary,
    },
    h4: {
      fontWeight: designTokens.typography.weights.medium,
      color: designTokens.colors.textPrimary,
    },
    h5: {
      fontWeight: designTokens.typography.weights.medium,
      color: designTokens.colors.textPrimary,
    },
    h6: {
      fontWeight: designTokens.typography.weights.medium,
      color: designTokens.colors.textPrimary,
    },
    body1: {
      color: designTokens.colors.textPrimary,
    },
    body2: {
      color: designTokens.colors.textSecondary,
    },
    button: {
      textTransform: 'none',
      fontWeight: designTokens.typography.weights.medium,
    },
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: designTokens.colors.surface,
          color: designTokens.colors.textPrimary,
          borderBottom: `1px solid ${designTokens.colors.border}`,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: designTokens.colors.surface,
          borderRadius: designTokens.borderRadius.card,
          border: `1px solid ${designTokens.colors.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.button,
          textTransform: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.button,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: designTokens.colors.tableHeaderBg,
          fontWeight: designTokens.typography.weights.medium,
          color: designTokens.colors.textSecondary,
        },
        root: {
          borderBottom: `1px solid ${designTokens.colors.border}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: designTokens.colors.hoverRowBg,
          },
        },
      },
    },
  },
});
