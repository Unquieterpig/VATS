import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import HeadsetManager from './components/HeadsetManager';
import { headsetApi } from './services/api';

function App() {
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check server health on startup
    headsetApi.health()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  const showAlert = (message: string, severity: 'success' | 'error' = 'success') => {
    setAlert({ message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VATS - VR Asset Tracking System
          </Typography>
          <Typography variant="body2">
            Server: {serverStatus === 'checking' ? 'Checking...' : 
                    serverStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <HeadsetManager onShowAlert={showAlert} />
      </Container>

      <Snackbar
        open={!!alert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {alert && (
          <Alert 
            onClose={handleCloseAlert} 
            severity={alert.severity}
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}

export default App;
