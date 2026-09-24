import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import AppShell from './components/layout/AppShell';

export default function App() {
  const { session, loading } = useAuth();

  // 1. Session check loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 2. Unauthenticated state gate
  if (!session) {
    return <AuthPage />;
  }

  // 3. Authenticated App Shell
  return <AppShell />;
}
