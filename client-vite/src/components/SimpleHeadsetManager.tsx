import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { headsetApi } from '../services/api';
import { Headset, HeadsetFormData } from '../types';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Monitor,
  User,
  Clock,
  Edit,
  GripVertical
} from 'lucide-react';

interface SimpleHeadsetManagerProps {
  onShowAlert: (message: string, severity?: 'success' | 'error') => void;
}

interface SortableCardProps {
  headset: Headset;
  onCheckout: (id: string) => void;
  onReturn: (id: string) => void;
  onEdit: (headset: Headset) => void;
  getStatusVariant: (headset: Headset) => 'destructive' | 'success';
  getStatusText: (headset: Headset) => string;
}

const SortableCard: React.FC<SortableCardProps> = ({ 
  headset, 
  onCheckout, 
  onReturn, 
  onEdit,
  getStatusVariant,
  getStatusText
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: headset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
              <Monitor className="h-5 w-5" />
              {headset.id}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(headset)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
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
                onClick={() => onReturn(headset.id)}
              >
                Return
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onCheckout(headset.id)}
              >
                Checkout
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SimpleHeadsetManager: React.FC<SimpleHeadsetManagerProps> = ({ onShowAlert }) => {
  const [headsets, setHeadsets] = useState<Headset[]>([]);
  const [suggestion, setSuggestion] = useState<Headset | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideAccountInUse, setHideAccountInUse] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHeadset, setEditingHeadset] = useState<Headset | null>(null);
  const [formData, setFormData] = useState<HeadsetFormData>({ id: '', model: 'Quest3', account_id: '' });
  const [errors, setErrors] = useState<Partial<HeadsetFormData>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleEdit = (headset: Headset) => {
    setEditingHeadset(headset);
    setFormData({
      id: headset.id,
      model: headset.model,
      account_id: headset.account_id,
    });
    setErrors({});
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingHeadset(null);
    setErrors({});
  };

  const handleEditSubmit = async () => {
    const newErrors: Partial<HeadsetFormData> = {};
    
    if (!formData.id.trim()) {
      newErrors.id = 'Headset ID cannot be empty';
    }
    if (!formData.account_id.trim()) {
      newErrors.account_id = 'Account ID cannot be empty';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && editingHeadset) {
      try {
        await headsetApi.update(editingHeadset.id, formData);
        onShowAlert('Headset updated successfully', 'success');
        await loadData();
        handleEditClose();
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to update headset';
        onShowAlert(message, 'error');
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setHeadsets((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={headsets.map(h => h.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {headsets.map((headset) => (
              <SortableCard
                key={headset.id}
                headset={headset}
                onCheckout={handleCheckout}
                onReturn={handleReturn}
                onEdit={handleEdit}
                getStatusVariant={getStatusVariant}
                getStatusText={getStatusText}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Headset: {editingHeadset?.id}</DialogTitle>
            <DialogDescription>
              Update the headset information. Changes will be saved to the server.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="headset-id">Headset ID</Label>
              <Input
                id="headset-id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., QuestyMcQuestface"
                className={errors.id ? 'border-destructive' : ''}
              />
              {errors.id && (
                <p className="text-sm text-destructive">{errors.id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Quest3">Quest3</option>
                <option value="Quest2">Quest2</option>
                <option value="HTC_Vive_XR">HTC_Vive_XR</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-id">Account ID</Label>
              <Input
                id="account-id"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                placeholder="e.g., account_1"
                className={errors.account_id ? 'border-destructive' : ''}
              />
              {errors.account_id && (
                <p className="text-sm text-destructive">{errors.account_id}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleEditClose}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Update Headset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleHeadsetManager;
