import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Button,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { designTokens } from '../theme/theme';

const drawerWidth = designTokens.layout.sidebarWidth;

export const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { text: 'Employees', path: '/admin/employees', icon: <PeopleIcon /> },
    { text: 'Salary Config', path: '/admin/salary-config', icon: <SettingsIcon /> },
    { text: 'Payslips', path: '/admin/payslips', icon: <ReceiptIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontFamily: theme.typography.fontFamily }}>
            HR Administration
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            endIcon={<LogoutIcon />}
            sx={{ textTransform: 'none' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: theme.typography.fontFamily }}>
            Salary Mgmt
          </Typography>
        </Toolbar>
        
        <List sx={{ px: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: `${designTokens.borderRadius.button}px`,
                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? theme.palette.primary.main : theme.palette.text.secondary, minWidth: '40px' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? designTokens.typography.weights.medium + 100 : designTokens.typography.weights.medium,
                      fontFamily: theme.typography.fontFamily
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: `${designTokens.spacing.container}px`,
          width: `calc(100% - ${drawerWidth}px)`,
          mt: '64px' // Toolbar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
