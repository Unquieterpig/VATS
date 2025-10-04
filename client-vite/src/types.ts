export interface Headset {
  id: string;
  model: string;
  account_id: string;
  last_used: string;
  in_use: boolean;
  custom_priority?: number;
}

export interface ApiResponse<T> {
  headsets?: Headset[];
  suggestion?: Headset | null;
  usedAccounts?: string[];
  successful?: string[];
  errors?: string[];
  message?: string;
  headset?: Headset;
}

export interface HeadsetFormData {
  id: string;
  model: string;
  account_id: string;
}

export interface PriorityFormData {
  priority: number;
}

export type HeadsetStatus = 'Available' | 'In Use' | 'Account in use';

export interface HeadsetWithStatus extends Headset {
  status: HeadsetStatus;
  priority: number;
  priorityDisplay: string;
}
