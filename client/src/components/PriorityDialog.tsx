import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { Headset } from '../types';

interface PriorityDialogProps {
  open: boolean;
  headset: Headset | null;
  onClose: () => void;
  onSubmit: (priority: number) => void;
}

const PriorityDialog: React.FC<PriorityDialogProps> = ({
  open,
  headset,
  onClose,
  onSubmit,
}) => {
  const [priority, setPriority] = useState<number>(1);
  const [error, setError] = useState<string>('');

  const DEFAULT_PRIORITY = { "Quest3": 1, "Quest2": 2, "HTC_Vive_XR": 3 };

  useEffect(() => {
    if (headset) {
      const currentPriority = headset.custom_priority !== undefined 
        ? headset.custom_priority 
        : DEFAULT_PRIORITY[headset.model as keyof typeof DEFAULT_PRIORITY] || 999;
      setPriority(currentPriority);
    }
  }, [headset]);

  const handleSubmit = () => {
    if (priority < 1 || priority > 100) {
      setError('Priority must be between 1 and 100');
      return;
    }

    setError('');
    onSubmit(priority);
    handleClose();
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handlePriorityChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setPriority(numValue);
      if (error) setError('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set Priority for {headset?.id}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Model: {headset?.model}
          </Typography>
          
          <TextField
            fullWidth
            label="Priority"
            type="number"
            value={priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            error={!!error}
            helperText={error || "Lower numbers = higher priority (1 = highest priority)"}
            inputProps={{ min: 1, max: 100 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Set Priority
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PriorityDialog;
