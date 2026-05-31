// src/modules/mail/api/index.ts
import api from '@/lib/axios';
import type { Mail, MailDetail, MailStatistics, MailTemplate, MailFilterRequest } from '../types';

// Mail endpoints
export const getMailStatistics = () => 
  api.get<MailStatistics>('/Mail/statistics');

  export const sendMail = (data: FormData, onProgress?: (progress: number) => void) => 
    api.post('/Mail/send', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes timeout
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
  });

export const fetchEmails = () => 
  api.post('/Mail/fetch');

export const getMails = (request: MailFilterRequest) => 
  api.post<{ mails: Mail[]; totalCount: number; grandTotalCount: number }>('/Mail', request);

export const getMailById = (id: number) => 
  api.get<MailDetail>(`/Mail/${id}`);

export const deleteMail = (id: number) => 
  api.delete(`/Mail/${id}`);

export const markAsRead = (id: number) => 
  api.post(`/Mail/${id}/read`);

export const markAsUnread = (id: number) => 
  api.post(`/Mail/${id}/unread`);

export const toggleStar = (id: number) => 
  api.post(`/Mail/${id}/star`);

export const removeStar = (id: number) => 
  api.post(`/Mail/${id}/unstar`);

export const moveToTrash = (id: number) => 
  api.post(`/Mail/${id}/trash`);

export const restoreFromTrash = (id: number) => 
  api.post(`/Mail/${id}/restore`);

export const bulkMailAction = (ids: number[], action: string) => 
  api.post('/Mail/bulk-action', { ids, action });

// Template endpoints
export const getTemplates = (params?: { q?: string; page?: number; limit?: number; includeGlobal?: boolean }) => 
  api.get<{ templates: MailTemplate[]; totalCount: number }>('/MailTemplate', { params });

export const getTemplateById = (id: number) => 
  api.get<MailTemplate>(`/MailTemplate/${id}`);

export const createTemplate = (data: Omit<MailTemplate, 'id' | 'createdAt' | 'createdByName'>) => 
  api.post<{ success: boolean; template: MailTemplate }>('/MailTemplate', data);

export const updateTemplate = (id: number, data: Partial<MailTemplate>) => 
  api.put<{ success: boolean; template: MailTemplate }>(`/MailTemplate/${id}`, data);

export const deleteTemplate = (id: number) => 
  api.delete(`/MailTemplate/${id}`);

export const downloadAttachment = (mailId: number, fileUrl: string) => 
  api.get(`/Mail/download/${mailId}`, {
    params: { fileUrl },
    responseType: 'blob'
  });