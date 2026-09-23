import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { AppThemeProvider } from '../theme/ThemeProvider';
import { OrganizationProfile, UserRole } from '@salary-mgmt/shared-types';

export const AppContent: React.FC = () => {
  const currentTheme = useTheme();

  const demoProfile: OrganizationProfile = {
    id: 'org-demo-001',
    name: 'ACME Technologies Pvt Ltd',
    code: 'ACME',
    contactEmail: 'admin@acme.corp',
    currency: 'INR',
    createdAt: '2026-09-23T00:00:00Z',
    updatedAt: '2026-09-23T00:00:00Z',
  };

  const sampleRole: UserRole = 'hr_admin';

  return (
    <Box
      data-testid="app-container"
      sx={{
        minHeight: '100vh',
        backgroundColor: currentTheme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar position="static" data-testid="app-bar">
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Salary Management System
          </Typography>
          <Chip
            label={sampleRole === 'hr_admin' ? 'HR Administrator' : 'Employee'}
            size="small"
            color="primary"
            variant="outlined"
            data-testid="role-chip"
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Foundation & UI Theme Initialized
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The foundational Nx monorepo, shared types, and Material UI design system are active.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Card data-testid="theme-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Design Tokens Preview
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Primary Color:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        data-testid="primary-color-swatch"
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          backgroundColor: currentTheme.palette.primary.main,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {currentTheme.palette.primary.main}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Background Default:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {currentTheme.palette.background.default}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Card Border Radius:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {currentTheme.shape.borderRadius}px
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Primary Font:</Typography>
                    <Typography
                      variant="body2"
                      data-testid="font-family-label"
                      sx={{ maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {currentTheme.typography.fontFamily}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card data-testid="shared-type-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Shared Models & Architecture
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Organization Profile:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {demoProfile.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Currency Standard:</Typography>
                    <Chip label={`₹ ${demoProfile.currency}`} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Org Code:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {demoProfile.code}
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant="contained" color="primary" size="medium">
                    Primary Action
                  </Button>
                  <Button variant="outlined" color="primary" size="medium">
                    Outlined Action
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export const App: React.FC = () => {
  return (
    <AppThemeProvider>
      <AppContent />
    </AppThemeProvider>
  );
};

export default App;
