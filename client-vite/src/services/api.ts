import axios from 'axios';
import { Headset, ApiResponse, HeadsetFormData, PriorityFormData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const headsetApi = {
  // Get all headsets with optional filtering
  getHeadsets: async (hideAccountInUse: boolean = false): Promise<ApiResponse<Headset[]>> => {
    const response = await api.get('/headsets', {
      params: { hide_account_in_use: hideAccountInUse }
    });
    return response.data;
  },

  // Get suggestion for next headset
  getSuggestion: async (): Promise<ApiResponse<Headset>> => {
    const response = await api.get('/suggestion');
    return response.data;
  },

  // Checkout headsets
  checkout: async (headsetIds: string[]): Promise<ApiResponse<string[]>> => {
    const response = await api.post('/checkout', { headsetIds });
    return response.data;
  },

  // Return headsets
  return: async (headsetIds: string[]): Promise<ApiResponse<string[]>> => {
    const response = await api.post('/return', { headsetIds });
    return response.data;
  },

  // Add new headset
  add: async (headsetData: HeadsetFormData): Promise<ApiResponse<Headset>> => {
    const response = await api.post('/headsets', headsetData);
    return response.data;
  },

  // Update headset
  update: async (id: string, headsetData: HeadsetFormData & { custom_priority?: number }): Promise<ApiResponse<Headset>> => {
    const response = await api.put(`/headsets/${id}`, headsetData);
    return response.data;
  },

  // Delete headset
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/headsets/${id}`);
    return response.data;
  },

  // Set priority
  setPriority: async (id: string, priorityData: PriorityFormData): Promise<ApiResponse<Headset>> => {
    const response = await api.put(`/headsets/${id}/priority`, priorityData);
    return response.data;
  },

  // Health check
  health: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api;
