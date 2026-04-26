import api from '@/lib/axios';
import type {
  ITranslation,
  TranslationFilterRequest,
  CreateTranslationRequest,
  UpdateTranslationRequest,
  TranslationModuleOption
} from '@/types/translation';

export const getTranslations = async (params: TranslationFilterRequest) => {
  const response = await api.post('/translations/list', params);
  return response.data;
};

export const getTranslationById = async (id: number) => {
  const response = await api.get(`/translations/${id}`);
  return response.data;
};

export const getTranslationForEdit = async (id: string) => {
  const response = await api.get(`/translations/${id}/edit`);
  return response.data;
};

export const createTranslation = async (data: CreateTranslationRequest) => {
  const response = await api.post('/translations/create', data);
  return response.data;
};

export const updateTranslation = async (id: number, data: UpdateTranslationRequest) => {
  const response = await api.put(`/translations/${id}`, data);
  return response.data;
};

export const deleteTranslation = async (id: number) => {
  const response = await api.delete(`/translations/${id}`);
  return response;
};

export const getTranslationModules = async (): Promise<TranslationModuleOption[]> => {
  const response = await api.get('/translations/modules');
  return response.data;
};

// Bulk delete translations
export const bulkDeleteTranslations = async (ids: string[]) => {
  const response = await api.post('/translations/bulk-delete', { ids });
  return response.data;
};