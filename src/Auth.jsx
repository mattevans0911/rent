import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Container, Box, Typography, TextField, Button, RadioGroup, FormControlLabel, Radio, Paper, Link } from '@mui/material';

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('tenant');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      // 1. Sign up the user with metadata so our Supabase trigger catches the name and role
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });
      if (signUpError) return setError(signUpError.message);
      alert('Check your email for a confirmation link!');
    } else {
      // 2. Log in existing user
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) return setError(signInError.message);
      if (data?.user) onAuthSuccess();
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignTarget: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          <Typography component="h1" variant="h5" textAlign="center">
            {isSignUp ? 'Create Your Account' : 'Sign In'}
          </Typography>
          
          {error && <Typography color="error" variant="body2">{error}</Typography>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isSignUp && (
              <TextField
                required
                fullWidth
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}
            <TextField
              required
              fullWidth
              label="Email Address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {isSignUp && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="textSecondary">I am a:</Typography>
                <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
                  <FormControlLabel value="tenant" control={<Radio />} label="Tenant" />
                  <FormControlLabel value="landlord" control={<Radio />} label="Landlord" />
                </RadioGroup>
              </Box>
            )}

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <Link href="#" variant="body2" textAlign="center" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}