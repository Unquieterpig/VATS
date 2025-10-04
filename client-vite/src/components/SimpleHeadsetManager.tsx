import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { headsetApi } from '../services/api';
import { Headset } from '../types';

interface SimpleHeadsetManagerProps {
  onShowAlert: (message: string, severity?: 'success' | 'error') => void;
}

const SimpleHeadsetManager: React.FC<SimpleHeadsetManagerProps> = ({ onShowAlert }) => {
  const [headsets, setHeadsets] = useState<Headset[]>([]);
  const [suggestion, setSuggestion] = useState<Headset | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await headsetApi.getHeadsets(false);
      
      if (response.headsets && response.suggestion !== undefined) {
        setHeadsets(response.headsets);
        setSuggestion(response.suggestion);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      onShowAlert('Failed to load headsets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckout = async (headsetId: string) => {
    try {
      const response = await headsetApi.checkout([headsetId]);
      onShowAlert(response.message || 'Headset checked out successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error checking out headset:', error);
      const message = error.response?.data?.error || 'Failed to checkout headset';
      onShowAlert(message, 'error');
    }
  };

  const handleReturn = async (headsetId: string) => {
    try {
      const response = await headsetApi.return([headsetId]);
      onShowAlert(response.message || 'Headset returned successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error returning headset:', error);
      const message = error.response?.data?.error || 'Failed to return headset';
      onShowAlert(message, 'error');
    }
  };

  const getStatusColor = (headset: Headset) => {
    if (headset.in_use) return 'error';
    return 'success';
  };

  const getStatusText = (headset: Headset) => {
    if (headset.in_use) return 'In Use';
    return 'Available';
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

      {/* Headsets List */}
      <Typography variant="h5" gutterBottom>
        VR Headsets ({headsets.length} total)
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {headsets.map((headset) => (
          <Card key={headset.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{headset.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Model: {headset.model} | Account: {headset.account_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Used: {new Date(headset.last_used).toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={getStatusText(headset)}
                    color={getStatusColor(headset) as any}
                    size="small"
                  />
                  
                  {headset.in_use ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleReturn(headset.id)}
                    >
                      Return
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleCheckout(headset.id)}
                    >
                      Checkout
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Refresh Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="outlined" onClick={loadData}>
          Refresh Data
        </Button>
      </Box>
    </Box>
  );
};

export default SimpleHeadsetManager;
