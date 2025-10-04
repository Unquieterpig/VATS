import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { AUTH_CONFIG } from './config/auth';
import { 
  Monitor, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-background/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <Monitor className="h-8 w-8" />
            VATS
          </CardTitle>
          <p className="text-muted-foreground">
            Varia's Awesome Tracking Software
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <Button type="submit" className="w-full" size="lg">
              Access System
            </Button>
          </form>
          
          <p className="text-sm text-muted-foreground text-center">
            Enter the system password to continue
          </p>
        </CardContent>
      </Card>
    </div>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">
              VATS - Varia's Awesome Tracking Software
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge 
              variant={serverStatus === 'online' ? 'success' : serverStatus === 'offline' ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {serverStatus === 'online' ? (
                <Wifi className="h-3 w-3" />
              ) : serverStatus === 'offline' ? (
                <WifiOff className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              Server: {serverStatus === 'checking' ? 'Checking...' : 
                      serverStatus === 'online' ? 'Online' : 'Offline'}
            </Badge>
            
            <ThemeToggle />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <React.Suspense fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading VATS Application...</p>
            </div>
          </div>
        }>
          <SimpleHeadsetManager onShowAlert={showAlert} />
        </React.Suspense>
      </main>

      {/* Alert Toast */}
      {alert && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert variant={alert.severity === 'success' ? 'success' : 'destructive'} className="min-w-[300px]">
            {alert.severity === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription className="flex items-center justify-between">
              <span>{alert.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseAlert}
                className="ml-2 h-auto p-1"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

function AppWithTheme() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vats-ui-theme">
      <App />
    </ThemeProvider>
  );
}

export default AppWithTheme;
