import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

export const AdminDashboardPlaceholder: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
        Dashboard Overview
      </Typography>
      
      <Card sx={{ mt: 3, borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Welcome to the HR Admin Dashboard. The full dashboard implementation is scheduled for a future sprint.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
