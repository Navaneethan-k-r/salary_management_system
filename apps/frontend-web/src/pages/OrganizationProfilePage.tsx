import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Snackbar, 
  Alert,
  Skeleton
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchOrganizationProfile, saveOrganizationProfile, resetSaveStatus } from '../store/slices/organizationSlice';
import { designTokens } from '../theme/theme';

export const OrganizationProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile, loading, saveStatus, error } = useAppSelector((state) => state.organization);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactEmail: ''
  });

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    code: '',
    contactEmail: ''
  });

  useEffect(() => {
    dispatch(fetchOrganizationProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        code: profile.code,
        contactEmail: profile.contactEmail
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = { name: '', code: '', contactEmail: '' };

    if (!formData.name.trim()) {
      errors.name = 'Organization name is required';
      isValid = false;
    }

    if (!formData.code.trim()) {
      errors.code = 'Organization code is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.code)) {
      errors.code = 'Organization code must be alphanumeric';
      isValid = false;
    }

    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Enter a valid email address';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(saveOrganizationProfile(formData));
    }
  };

  const handleCloseSnackbar = () => {
    dispatch(resetSaveStatus());
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Organization Profile</Typography>
        <Card sx={{ p: 2, borderRadius: designTokens.borderRadius.card }}>
          <CardContent>
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ mb: 3, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} width={120} sx={{ borderRadius: 1 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Organization Profile</Typography>
      
      {!profile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Initial setup required. Please configure your organization details below.
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to save organization profile. {error || 'Please try again.'}
        </Alert>
      )}

      <Card 
        elevation={0} 
        sx={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: designTokens.borderRadius.card,
          p: 2 
        }}
      >
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              margin="normal"
              label="Organization Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              disabled={saveStatus === 'saving'}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Organization Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={!!validationErrors.code}
              helperText={validationErrors.code}
              disabled={saveStatus === 'saving'}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              error={!!validationErrors.contactEmail}
              helperText={validationErrors.contactEmail}
              disabled={saveStatus === 'saving'}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Currency"
              value="INR (₹) - Indian Rupee"
              disabled
              sx={{ mb: 3 }}
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={saveStatus === 'saving'}
              sx={{ borderRadius: designTokens.borderRadius.button }}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={saveStatus === 'success'}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Organization profile saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};
