import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { Headset, HeadsetFormData } from '../types';

interface EditHeadsetDialogProps {
  open: boolean;
  headset: Headset | null;
  onClose: () => void;
  onSubmit: (data: HeadsetFormData) => void;
}

const EditHeadsetDialog: React.FC<EditHeadsetDialogProps> = ({
  open,
  headset,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<HeadsetFormData>({
    id: '',
    model: 'Quest3',
    account_id: '',
  });

  const [errors, setErrors] = useState<Partial<HeadsetFormData>>({});

  useEffect(() => {
    if (headset) {
      setFormData({
        id: headset.id,
        model: headset.model,
        account_id: headset.account_id,
      });
    }
  }, [headset]);

  const handleSubmit = () => {
    const newErrors: Partial<HeadsetFormData> = {};
    
    if (!formData.id.trim()) {
      newErrors.id = 'Headset ID cannot be empty';
    }
    if (!formData.account_id.trim()) {
      newErrors.account_id = 'Account ID cannot be empty';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof HeadsetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Headset: {headset?.id}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Headset ID"
            value={formData.id}
            onChange={(e) => handleChange('id', e.target.value)}
            error={!!errors.id}
            helperText={errors.id}
            placeholder="e.g., QuestyMcQuestface"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Model</InputLabel>
            <Select
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              label="Model"
            >
              <MenuItem value="Quest3">Quest3</MenuItem>
              <MenuItem value="Quest2">Quest2</MenuItem>
              <MenuItem value="HTC_Vive_XR">HTC_Vive_XR</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Account ID"
            value={formData.account_id}
            onChange={(e) => handleChange('account_id', e.target.value)}
            error={!!errors.account_id}
            helperText={errors.account_id}
            placeholder="e.g., account_1"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Update Headset
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditHeadsetDialog;
