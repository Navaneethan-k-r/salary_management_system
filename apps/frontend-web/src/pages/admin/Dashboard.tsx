import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Button,
} from '@mui/material';

export interface PayrollRun {
  id: string;
  date: string;
  totalAmount: number;
  status: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  recentPayrollRuns: PayrollRun[];
}

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = localStorage.getItem('session_token');
      if (!token) {
        const sessionData = sessionStorage.getItem('auth_session');
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            token = parsed.token || null;
          } catch {
            // ignore JSON parse error
          }
        }
      }

      const response = await fetch('/api/employee/dashboard/metrics', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchMetrics}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={4}>
        {/* Total Employees Card */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Employees
              </Typography>
              {loading ? (
                <Skeleton data-testid="employee-loading-skeleton" variant="text" width="60%" height={60} />
              ) : (
                <Typography variant="h3" color="primary">
                  {metrics?.totalEmployees || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payroll Runs */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Recent Payroll Runs
              </Typography>
              {loading ? (
                <Skeleton data-testid="payroll-loading-skeleton" variant="rectangular" width="100%" height={200} />
              ) : metrics?.recentPayrollRuns && metrics.recentPayrollRuns.length > 0 ? (
                <TableContainer component={Paper} elevation={0} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Total Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.recentPayrollRuns.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell>{run.date}</TableCell>
                          <TableCell>{run.status}</TableCell>
                          <TableCell align="right">{formatCurrency(run.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                  No recent payroll runs.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
