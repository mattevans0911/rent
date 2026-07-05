import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import LandlordDashboard from './landlord/LandlordDashboard';
import TenantDashboard from './tenant/TenantDashboard';


export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session when app mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for auth changes (login/logout/signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch role info from public.profiles
  const fetchProfile = async (userId) => {
    try {
      console.log("1. Starting profile fetch for user UUID:", userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Database Error on Fetch:", error);
        throw error;
      }

      console.log("2. Raw Database Response received by React:", data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not logged in, show Auth component
  if (!session) {
    return <Auth onAuthSuccess={() => setLoading(true)} />;
  }

  // If logged in, route based on role
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, bg: '#f5f5f5' }}>
        <Button variant="outlined" color="error" onClick={handleLogout}>Log Out</Button>
      </Box>
      
      {profile?.role === 'landlord' ? (
        <LandlordDashboard />
      ) : (
        <TenantDashboard />
      )}
    </Box>
  );
}