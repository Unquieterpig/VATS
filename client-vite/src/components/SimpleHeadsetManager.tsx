import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { headsetApi } from '../services/api';
import { Headset } from '../types';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Monitor,
  User,
  Clock
} from 'lucide-react';

interface SimpleHeadsetManagerProps {
  onShowAlert: (message: string, severity?: 'success' | 'error') => void;
}

const SimpleHeadsetManager: React.FC<SimpleHeadsetManagerProps> = ({ onShowAlert }) => {
  const [headsets, setHeadsets] = useState<Headset[]>([]);
  const [suggestion, setSuggestion] = useState<Headset | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideAccountInUse, setHideAccountInUse] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await headsetApi.getHeadsets(hideAccountInUse);
      
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
  }, [hideAccountInUse]);

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

  const getStatusVariant = (headset: Headset) => {
    if (headset.in_use) return 'destructive';
    return 'success';
  };

  const getStatusText = (headset: Headset) => {
    if (headset.in_use) return 'In Use';
    return 'Available';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading headsets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Suggestion Banner */}
      <Card className={suggestion ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${suggestion ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {suggestion ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Suggested Next Headset: {suggestion.id} ({suggestion.model})
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="h-5 w-5" />
                  No Headsets Available
                </div>
              )}
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          VR Headsets ({headsets.length} total)
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="hide-account-in-use"
              checked={hideAccountInUse}
              onCheckedChange={setHideAccountInUse}
            />
            <label htmlFor="hide-account-in-use" className="text-sm font-medium">
              Hide 'Account in Use' headsets
            </label>
          </div>
          
          <Button variant="outline" onClick={loadData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Headsets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {headsets.map((headset) => (
          <Card key={headset.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {headset.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                  <span>Model: {headset.model}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Account: {headset.account_id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last Used: {new Date(headset.last_used).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Badge variant={getStatusVariant(headset)}>
                  {getStatusText(headset)}
                </Badge>
                
                {headset.in_use ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReturn(headset.id)}
                  >
                    Return
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleCheckout(headset.id)}
                  >
                    Checkout
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {headsets.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No headsets found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleHeadsetManager;
