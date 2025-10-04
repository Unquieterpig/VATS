import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Alert,
  Snackbar,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { AUTH_CONFIG } from './config/auth';

// Password authentication component
function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === AUTH_CONFIG.DEFAULT_PASSWORD) {
      // Store authentication in localStorage
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED, 'true');
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TIME, Date.now().toString());
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              VATS
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Varia's Awesome Tracking Software
            </Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              helperText={error}
              sx={{ mb: 3 }}
              autoFocus
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mb: 2 }}
            >
              Access System
            </Button>
          </form>
          
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            Enter the system password to continue
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED);
    const authTime = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TIME);
    
    if (authStatus === 'true' && authTime) {
      // Check if authentication is still valid
      const timeDiff = Date.now() - parseInt(authTime);
      
      if (timeDiff < AUTH_CONFIG.AUTH_DURATION) {
        setIsAuthenticated(true);
      } else {
        // Clear expired authentication
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED);
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TIME);
      }
    }

    // Check server health
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

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTHENTICATED);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TIME);
    setIsAuthenticated(false);
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return <LoginPrompt onLogin={handleLogin} />;
  }

  // Load the simplified VATS application first
  const SimpleHeadsetManager = React.lazy(() => import('./components/SimpleHeadsetManager'));
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VATS - Varia's Awesome Tracking Software
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Server: {serverStatus === 'checking' ? 'Checking...' : 
                    serverStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{ ml: 1 }}
          >
            Logout
          </Button>
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
