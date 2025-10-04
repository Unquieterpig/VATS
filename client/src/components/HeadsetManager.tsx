import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import HeadsetTable from './HeadsetTable';
import AddHeadsetDialog from './AddHeadsetDialog';
import EditHeadsetDialog from './EditHeadsetDialog';
import PriorityDialog from './PriorityDialog';
import { headsetApi } from '../services/api';
import { Headset, HeadsetWithStatus, HeadsetFormData } from '../types';

interface HeadsetManagerProps {
  onShowAlert: (message: string, severity?: 'success' | 'error') => void;
}

const DEFAULT_PRIORITY = { "Quest3": 1, "Quest2": 2, "HTC_Vive_XR": 3 };

const HeadsetManager: React.FC<HeadsetManagerProps> = ({ onShowAlert }) => {
  const [headsets, setHeadsets] = useState<HeadsetWithStatus[]>([]);
  const [suggestion, setSuggestion] = useState<Headset | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideAccountInUse, setHideAccountInUse] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [selectedHeadset, setSelectedHeadset] = useState<Headset | null>(null);

  const getUsedAccounts = useCallback((headsets: Headset[]) => {
    return new Set(headsets.filter(h => h.in_use).map(h => h.account_id));
  }, []);

  const getPriority = useCallback((headset: Headset) => {
    if (headset.custom_priority !== undefined) {
      return headset.custom_priority;
    }
    return DEFAULT_PRIORITY[headset.model as keyof typeof DEFAULT_PRIORITY] || 999;
  }, []);

  const getStatus = useCallback((headset: Headset, usedAccounts: Set<string>) => {
    if (headset.in_use) return 'In Use';
    if (usedAccounts.has(headset.account_id)) return 'Account in use';
    return 'Available';
  }, []);

  const getPriorityDisplay = useCallback((headset: Headset) => {
    if (headset.custom_priority !== undefined) {
      return `${headset.custom_priority} (Custom)`;
    }
    return `${DEFAULT_PRIORITY[headset.model as keyof typeof DEFAULT_PRIORITY] || 999} (Default)`;
  }, []);

  const processHeadsets = useCallback((rawHeadsets: Headset[], usedAccounts: Set<string>) => {
    return rawHeadsets.map(headset => ({
      ...headset,
      status: getStatus(headset, usedAccounts) as 'Available' | 'In Use' | 'Account in use',
      priority: getPriority(headset),
      priorityDisplay: getPriorityDisplay(headset),
    }));
  }, [getStatus, getPriority, getPriorityDisplay]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await headsetApi.getHeadsets(hideAccountInUse);
      
      if (response.headsets && response.suggestion !== undefined) {
        const usedAccounts = getUsedAccounts(response.headsets);
        const processedHeadsets = processHeadsets(response.headsets, usedAccounts);
        setHeadsets(processedHeadsets);
        setSuggestion(response.suggestion);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      onShowAlert('Failed to load headsets', 'error');
    } finally {
      setLoading(false);
    }
  }, [hideAccountInUse, getUsedAccounts, processHeadsets, onShowAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckout = async () => {
    if (selectedRows.length === 0) {
      onShowAlert('Please select at least one headset', 'error');
      return;
    }

    try {
      const response = await headsetApi.checkout(selectedRows as string[]);
      
      if (response.errors && response.errors.length > 0) {
        onShowAlert(`Checkout completed with errors: ${response.errors.join(', ')}`, 'error');
      } else {
        onShowAlert(response.message || 'Headsets checked out successfully');
      }
      
      setSelectedRows([]);
      await loadData();
    } catch (error) {
      console.error('Error checking out headsets:', error);
      onShowAlert('Failed to checkout headsets', 'error');
    }
  };

  const handleReturn = async () => {
    if (selectedRows.length === 0) {
      onShowAlert('Please select at least one headset', 'error');
      return;
    }

    try {
      const response = await headsetApi.return(selectedRows as string[]);
      onShowAlert(response.message || 'Headsets returned successfully');
      setSelectedRows([]);
      await loadData();
    } catch (error) {
      console.error('Error returning headsets:', error);
      onShowAlert('Failed to return headsets', 'error');
    }
  };

  const handleAddHeadset = async (formData: HeadsetFormData) => {
    try {
      const response = await headsetApi.add(formData);
      onShowAlert(response.message || 'Headset added successfully');
      setAddDialogOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Error adding headset:', error);
      const message = error.response?.data?.error || 'Failed to add headset';
      onShowAlert(message, 'error');
    }
  };

  const handleEditHeadset = async (formData: HeadsetFormData) => {
    if (!selectedHeadset) return;

    try {
      const response = await headsetApi.update(selectedHeadset.id, formData);
      onShowAlert(response.message || 'Headset updated successfully');
      setEditDialogOpen(false);
      setSelectedHeadset(null);
      await loadData();
    } catch (error: any) {
      console.error('Error updating headset:', error);
      const message = error.response?.data?.error || 'Failed to update headset';
      onShowAlert(message, 'error');
    }
  };

  const handleRemoveHeadset = async () => {
    if (selectedRows.length === 0) {
      onShowAlert('Please select at least one headset', 'error');
      return;
    }

    const headsetIds = selectedRows as string[];
    const inUseHeadsets = headsets.filter(h => headsetIds.includes(h.id) && h.in_use);
    
    if (inUseHeadsets.length > 0) {
      const inUseIds = inUseHeadsets.map(h => h.id);
      onShowAlert(`Cannot remove headsets that are currently in use: ${inUseIds.join(', ')}`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${headsetIds.length} headset(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(headsetIds.map(id => headsetApi.delete(id)));
      onShowAlert(`Removed ${headsetIds.length} headset(s) successfully`);
      setSelectedRows([]);
      await loadData();
    } catch (error: any) {
      console.error('Error removing headsets:', error);
      const message = error.response?.data?.error || 'Failed to remove headsets';
      onShowAlert(message, 'error');
    }
  };

  const handleSetPriority = () => {
    if (selectedRows.length !== 1) {
      onShowAlert('Please select exactly one headset to set its priority', 'error');
      return;
    }

    const headset = headsets.find(h => h.id === selectedRows[0]);
    if (!headset) return;

    if (headset.in_use) {
      onShowAlert(`Cannot edit headset '${headset.id}' while it's in use`, 'error');
      return;
    }

    setSelectedHeadset(headset);
    setPriorityDialogOpen(true);
  };

  const handlePrioritySet = async (priority: number) => {
    if (!selectedHeadset) return;

    try {
      const response = await headsetApi.setPriority(selectedHeadset.id, { priority });
      onShowAlert(response.message || 'Priority set successfully');
      setPriorityDialogOpen(false);
      setSelectedHeadset(null);
      await loadData();
    } catch (error: any) {
      console.error('Error setting priority:', error);
      const message = error.response?.data?.error || 'Failed to set priority';
      onShowAlert(message, 'error');
    }
  };

  const handleEditDialog = () => {
    if (selectedRows.length !== 1) {
      onShowAlert('Please select exactly one headset to edit', 'error');
      return;
    }

    const headset = headsets.find(h => h.id === selectedRows[0]);
    if (!headset) return;

    if (headset.in_use) {
      onShowAlert(`Cannot edit headset '${headset.id}' while it's in use. Please return it first.`, 'error');
      return;
    }

    setSelectedHeadset(headset);
    setEditDialogOpen(true);
  };

  const getRowClassName = (params: any) => {
    if (suggestion && params.row.id === suggestion.id) {
      return 'suggested-row';
    }
    return '';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Suggestion Banner */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography 
          variant="h6" 
          align="center"
          sx={{
            color: suggestion ? 'success.main' : 'error.main',
            fontWeight: 'bold',
          }}
        >
          {suggestion 
            ? `Suggested Next Headset: ${suggestion.id} (${suggestion.model})`
            : 'No Headsets Available'
          }
        </Typography>
      </Paper>

      {/* Filter Controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              checked={hideAccountInUse}
              onChange={(e) => setHideAccountInUse(e.target.checked)}
            />
          }
          label="Hide 'Account in Use' headsets"
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckout}
            disabled={selectedRows.length === 0}
          >
            Checkout Selected
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleReturn}
            disabled={selectedRows.length === 0}
          >
            Return Selected
          </Button>
          <Button
            variant="outlined"
            onClick={handleSetPriority}
            disabled={selectedRows.length !== 1}
          >
            Set Priority
          </Button>
          <Button
            variant="outlined"
            onClick={() => setAddDialogOpen(true)}
          >
            Add Headset
          </Button>
          <Button
            variant="outlined"
            onClick={handleEditDialog}
            disabled={selectedRows.length !== 1}
          >
            Edit Headset
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleRemoveHeadset}
            disabled={selectedRows.length === 0}
          >
            Remove Headset
          </Button>
          <Button
            variant="outlined"
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Headset Table */}
      <HeadsetTable
        headsets={headsets}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        getRowClassName={getRowClassName}
      />

      {/* Dialogs */}
      <AddHeadsetDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddHeadset}
      />

      <EditHeadsetDialog
        open={editDialogOpen}
        headset={selectedHeadset}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedHeadset(null);
        }}
        onSubmit={handleEditHeadset}
      />

      <PriorityDialog
        open={priorityDialogOpen}
        headset={selectedHeadset}
        onClose={() => {
          setPriorityDialogOpen(false);
          setSelectedHeadset(null);
        }}
        onSubmit={handlePrioritySet}
      />
    </Box>
  );
};

export default HeadsetManager;
