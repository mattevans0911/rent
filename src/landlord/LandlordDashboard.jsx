import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Container, Typography, Box, Tabs, Tab, Button, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Checkbox, IconButton, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export default function LandlordDashboard() {
  const [currentTab, setCurrentTab] = useState(0);
  const [properties, setProperties] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  
  // State for editing rent notes modal
  const [openNotesModal, setOpenNotesModal] = useState(false);
  const [selectedLedgerRow, setSelectedLedgerRow] = useState(null);
  const [tempNote, setTempNote] = useState('');

  useEffect(() => {
    fetchLandlordData();
  }, []);

  const fetchLandlordData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Fetch properties owned by this landlord
    const { data: props } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', user.id);
    setProperties(props || []);

    // 2. Fetch the current rent ledger status for those properties
    // We get the details alongside tenant and profile names using joins
    const { data: ledgerData } = await supabase
      .from('rent_ledger')
      .select(`
        id, is_paid, notes, month_year,
        tenants ( id, rent_amount, profiles ( full_name ) ),
        properties ( address )
      `);
    setLedger(ledgerData || []);
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    if (!newAddress) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('properties')
      .insert({ address: newAddress, landlord_id: user.id });

    if (!error) {
      setNewAddress('');
      fetchLandlordData();
    }
  };

  const handlePaymentToggle = async (rowId, currentStatus) => {
    const { error } = await supabase
      .from('rent_ledger')
      .update({ is_paid: !currentStatus })
      .eq('id', rowId);

    if (!error) fetchLandlordData();
  };

  const handleOpenNotes = (row) => {
    setSelectedLedgerRow(row);
    setTempNote(row.notes || '');
    setOpenNotesModal(true);
  };

  const handleSaveNotes = async () => {
    const { error } = await supabase
      .from('rent_ledger')
      .update({ notes: tempNote })
      .eq('id', selectedLedgerRow.id);

    if (!error) {
      setOpenNotesModal(false);
      fetchLandlordData();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Landlord Control Panel
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)}>
          <Tab label="Rent Ledger" />
          <Tab label="Properties & Units" />
          <Tab label="Maintenance Requests" />
        </Tabs>
      </Box>

      {/* TAB 0: RENT LEDGER BOARD */}
      {currentTab === 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Monthly Rent Tracker</Typography>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>**Property Address**</TableCell>
                  <TableCell>**Tenant Name**</TableCell>
                  <TableCell>**Rent Due**</TableCell>
                  <TableCell>**Month**</TableCell>
                  <TableCell align="center">**Mark Paid**</TableCell>
                  <TableCell>**Tracking Notes**</TableCell>
                  <TableCell align="center">**Actions**</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">No ledger history logged yet.</TableCell></TableRow>
                ) : (
                  ledger.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.properties?.address}</TableCell>
                      <TableCell>{row.tenants?.profiles?.full_name || 'Vacant'}</TableCell>
                      <TableCell>${row.tenants?.rent_amount || '0'}</TableCell>
                      <TableCell>{row.month_year}</TableCell>
                      <TableCell align="center">
                        <Checkbox 
                          checked={row.is_paid} 
                          onChange={() => handlePaymentToggle(row.id, row.is_paid)}
                        />
                      </TableCell>
                      <TableCell>{row.notes || <span style={{ color: '#aaa', fontSize: '0.85rem' }}>None</span>}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpenNotes(row)}>
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 1: PROPERTY MANAGEMENT */}
      {currentTab === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 4 }} elevation={1}>
            <Typography variant="h6" gutterBottom>Add New Real Estate Asset</Typography>
            <Box component="form" onSubmit={handleAddProperty} sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Property Street Address, City, State" 
                variant="outlined" 
                fullWidth
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
              <Button type="submit" variant="contained" color="primary" sx={{ px: 4 }}>Add</Button>
            </Box>
          </Paper>

          <Typography variant="h6" sx={{ mb: 2 }}>Your Portfolio Overview</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>**Property ID**</TableCell>
                  <TableCell>**Address**</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell style={{ fontSize: '0.8rem', color: '#666' }}>{prop.id}</TableCell>
                    <TableCell>{prop.address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: MAINTENANCE REQUESTS (PLACEHOLDER FOR NOW) */}
      {currentTab === 2 && (
        <Box>
          <Typography variant="h6">Incoming Maintenance Tickets</Typography>
          <Typography variant="body2" color="textSecondary">Tenant portal submission tracking setup goes here.</Typography>
        </Box>
      )}

      {/* NOTES MODAL DIALOG */}
      <Dialog open={openNotesModal} onClose={() => setOpenNotesModal(false)} fullWidth maxWidth="xs">
        <DialogTitle>Update Rent Tracker Notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Internal Notes (e.g. Paid via check, $50 Late fee added)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotesModal(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}