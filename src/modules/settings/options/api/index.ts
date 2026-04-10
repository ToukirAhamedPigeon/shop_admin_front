import api from '@/lib/axios';
import type {
  IOption,
  OptionFilterRequest,
  CreateOptionRequest,
  UpdateOptionRequest,
  DeleteOptionInfo
} from '@/types/option';

// Get filtered list of options
export const getOptions = async (params: OptionFilterRequest) => {
  const response = await api.post('/options/list', params);
  return response.data;
};

// Get single option by ID
export const getOptionById = async (id: string) => {
  const response = await api.get(`/options/${id}`);
  return response.data;
};

// Get option for editing
export const getOptionForEdit = async (id: string) => {
  const response = await api.get(`/options/${id}/edit`);
  return response.data;
};

// Create new option(s)
export const createOption = async (data: CreateOptionRequest) => {
  const response = await api.post('/options/create', data);
  return response.data;
};

// Update an option
export const updateOption = async (id: string, data: UpdateOptionRequest) => {
  const response = await api.put(`/options/${id}`, data);
  return response.data;
};

// Delete an option (soft or permanent)
export const deleteOption = async (id: string, permanent: boolean = false) => {
  const response = await api.delete(`/options/${id}?permanent=${permanent}`);
  return response;
};

// Restore a soft-deleted option
export const restoreOption = async (id: string) => {
  const response = await api.post(`/options/${id}/restore`);
  return response.data;
};

// Check if an option can be permanently deleted
export const getOptionDeleteInfo = async (id: string): Promise<DeleteOptionInfo> => {
  const response = await api.get(`/options/${id}/delete-info`);
  return response.data;
};

// Get parent options for dropdown
export const getParentOptions = async (search?: string, limit?: number) => {
  const response = await api.post('/options/parents', {
    search: search || '',
    limit: limit || 100,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  return response.data;
};