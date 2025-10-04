import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Alert,
  Snackbar,
  Button,
} from '@mui/material';

// Simple test component first
function TestComponent() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        VATS - VR Asset Tracking System
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Welcome to the web version of VATS! The application is loading...
      </Typography>
      <Button variant="contained" color="primary">
        Test Button
      </Button>
    </Box>
  );
}

function App() {
  const [showFullApp, setShowFullApp] = useState(false);
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check server health on startup
    fetch('/api/health')
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  const showAlert = (message: string, severity: 'success' | 'error' = 'success') => {
    setAlert({ message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(null);
  };

  if (!showFullApp) {
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
          <TestComponent />
          <Button 
            variant="contained" 
            onClick={() => setShowFullApp(true)}
            sx={{ mt: 2 }}
          >
            Load Full Application
          </Button>
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

  // Load the simplified VATS application first
  const SimpleHeadsetManager = React.lazy(() => import('./components/SimpleHeadsetManager'));
  
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
        <React.Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Typography variant="h6">Loading VATS Application...</Typography>
          </Box>
        }>
          <SimpleHeadsetManager onShowAlert={showAlert} />
        </React.Suspense>
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
