// app/(dashboard)/admin/users/api.ts

import api from "@/lib/axios";
import type { AxiosResponse } from "axios";

export const createUsers = async (formDataPayload: FormData): Promise<AxiosResponse> => {
  const response = await api.post("/users/create", formDataPayload, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
}

export const regenerateQr = async (id: string) => {
  try {
    const response = await api.post(`/users/${id}/regenerate-qr`);
    return response;
  } catch (error: any) {
    console.error("Regenerate QR error:", error);
    throw error;
  }
};

export const updateUser = async (id: string, formData: FormData) => {
  const response = await api.put(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response;
};

export const getUserForEditById = (id: string) =>
  api.get(`/users/${id}/edit`)

export const getUserById = (id: string) =>
  api.get(`/users/${id}`)

export const getUserProfile = () =>
  api.get(`/users/profile`)

export const updateProfile = (formData: FormData) =>
  api.put(`/users/profile`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  })

export const changePasswordRequest = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const response = await api.post("/auth/password-reset/change-password/request", data);
  return response.data;
};

export const verifyPasswordChange = async (token: string) => {
  const response = await api.post("/auth/password-reset/change-password/verify", { token });
  return response.data;
};

export const validateChangeToken = async (token: string) => {
  const response = await api.get(`/auth/password-reset/change-password/validate/${token}`);
  return response.data;
};

// Delete user (soft or permanent)
export const deleteUser = async (id: string, permanent: boolean = false) => {
  const response = await api.delete(`/users/${id}?permanent=${permanent}`);
  return response;
};

// Restore user
export const restoreUser = async (id: string) => {
  const response = await api.post(`/users/${id}/restore`);
  return response.data;
};

// Get delete info - checks if permanent delete is possible
export const getDeleteInfo = async (id: string) => {
  const response = await api.get(`/users/${id}/delete-info`);
  return response.data;
};

// Bulk operations
export const bulkDeleteUsers = async (ids: string[], permanent: boolean = false) => {
  const response = await api.post('/users/bulk-delete', { ids, permanent });
  return response.data;
};

// Bulk restore users
export const bulkRestoreUsers = async (ids: string[]) => {
  const response = await api.post('/users/bulk-restore', { ids });
  return response.data;
};