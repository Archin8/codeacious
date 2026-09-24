import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState(0); // 0 = Sign In, 1 = Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleTabChange = (_event, newValue) => {
    setTab(newValue);
    setErrorMsg('');
    setInfoMsg('');
  };

  const mapAuthError = (message) => {
    if (!message) return 'An error occurred. Please try again.';
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials')) return 'Wrong email or password.';
    if (lower.includes('user already registered')) return 'That email already has an account. Try signing in.';
    if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
      return "Can't reach the server. Check your connection.";
    }
    return message;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    // Basic validation
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      if (tab === 0) {
        // Sign In
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(mapAuthError(error.message));
        }
      } else {
        // Sign Up
        const { data, error } = await signUp(email, password);
        if (error) {
          setErrorMsg(mapAuthError(error.message));
        } else if (data?.session) {
          // Immediate sign in (no email confirmation required)
          setInfoMsg('Account created successfully!');
        } else if (data?.user) {
          // Email confirmation is required by Supabase project settings
          setInfoMsg('Check your email to confirm your account, then sign in.');
        }
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', p: 4 }}>
        <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h1" component="h1">
              AI Journal
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            Your private journal, with an AI that only knows what you wrote.
          </Typography>
        </Stack>

        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Sign in" />
          <Tab label="Sign up" />
        </Tabs>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {infoMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {infoMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              fullWidth
              required
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 0 ? 'current-password' : 'new-password'}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              fullWidth
              sx={{ mt: 1 }}
            >
              {submitting
                ? 'Processing...'
                : tab === 0
                ? 'Sign in'
                : 'Sign up'}
            </Button>
          </Stack>
        </Box>
      </Card>
    </Box>
  );
}
