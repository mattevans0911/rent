import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Container, Typography, Box, Grid, Paper, TextField, 
  Button, Card, CardContent, Chip, Divider, List, ListItem, ListItemText 
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function TenantDashboard() {
  const [landlordLinks, setLandlordLinks] = useState({ venmo: '', zelle: '', paypal: '' });
  const [rentAmount, setRentAmount] = useState(0);
  const [address, setAddress] = useState('');
  
  // Maintenance Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState([]);
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch tenant's rent allocation and property address details via joins
    const { data: tenantInfo } = await supabase
      .from('tenants')
      .select(`
        rent_amount,
        properties (
          address,
          profiles ( payment_links )
        )
      `)
      .eq('id', user.id)
      .single();

    if (tenantInfo) {
      setRentAmount(tenantInfo.rent_amount || 0);
      setAddress(tenantInfo.properties?.address || 'No address linked yet');
      setLandlordLinks(tenantInfo.properties?.profiles?.payment_links || {});
    }

    // 2. Fetch past maintenance tickets submitted by this tenant
    const { data: ticketData } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false });
    
    setTickets(ticketData || []);
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the property ID assigned to this tenant to route the ticket correctly
    const { data: tenantRecord } = await supabase
      .from('tenants')
      .select('property_id')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('maintenance_requests')
      .insert({
        tenant_id: user.id,
        property_id: tenantRecord?.property_id,
        title,
        description,
        status: 'pending'
      });

    if (!error) {
      setTitle('');
      setDescription('');
      setFormMessage('Ticket submitted successfully!');
      fetchTenantData(); // Refresh ticket history feed
    } else {
      setFormMessage('Error filing request. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Tenant Portal
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
        Unit: {address}
      </Typography>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: PAYMENT HUBS */}
        <Grid item xs={12} md={5}>
          <Card elevation={3} sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Monthly Rent Charges
              </Typography>
              <Typography variant="h3" color="primary" sx={{ my: 2, fontWeight: 'medium' }}>
                ${rentAmount}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Landlord Payment Portals:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">**Venmo:**</Typography>
                  <Typography variant="body2" color="textSecondary">{landlordLinks.venmo || 'Not provided'}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">**Zelle:**</Typography>
                  <Typography variant="body2" color="textSecondary">{landlordLinks.zelle || 'Not provided'}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">**PayPal:**</Typography>
                  <Typography variant="body2" color="textSecondary">{landlordLinks.paypal || 'Not provided'}</Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: MAINTENANCE ISSUES */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Submit Maintenance Request
            </Typography>
            {formMessage && <Typography color="primary" variant="body2" sx={{ mb: 2 }}>{formMessage}</Typography>}
            
            <Box component="form" onSubmit={handleMaintenanceSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField 
                label="What is the issue? (e.g., Leaky Kitchen Faucet)" 
                variant="outlined" 
                fullWidth 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField 
                label="Detailed description of the problem..." 
                variant="outlined" 
                fullWidth 
                multiline 
                rows={4} 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit" variant="contained" color="primary" startIcon={<BuildIcon />} sx={{ py: 1.5 }}>
                File Request
              </Button>
            </Box>
          </Paper>

          {/* TICKET TIMELINE HISTORY */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Your Request History
          </Typography>
          <Paper elevation={1}>
            <List>
              {tickets.length === 0 ? (
                <ListItem><ListItemText primary="No requests filed yet." /></ListItem>
              ) : (
                tickets.map((ticket) => (
                  <React.Fragment key={ticket.id}>
                    <ListItem alignItems="flex-start" secondaryAction={
                      <Chip 
                        label={ticket.status.toUpperCase()} 
                        color={ticket.status === 'completed' ? 'success' : ticket.status === 'in_progress' ? 'warning' : 'default'} 
                        size="small" 
                      />
                    }>
                      <ListItemText
                        primary={ticket.title}
                        secondary={ticket.description}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}