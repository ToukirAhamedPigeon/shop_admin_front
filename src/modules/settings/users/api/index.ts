import api from "@/lib/axios";
import type { AxiosResponse } from "axios";

export const createUsers = async (formDataPayload: FormData): Promise<AxiosResponse> => {
  const response =  await api.post("/users/create", formDataPayload, {
      withCredentials: true,  
      headers: {
        "Content-Type": "multipart/form-data", 
      },
    });
   return response;
}

export const regenerateQr = (id: string) =>
  api.post(`/users/${id}/regenerate-qr`)

export const updateUser = async (id: string, formData: FormData) =>
  api.put(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  })

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

// Delete user
export const deleteUser = async (id: string, permanent: boolean = false) => {
  const response = await api.delete(`/users/${id}?permanent=${permanent}`);
  return response.data;
};

// Restore user
export const restoreUser = async (id: string) => {
  const response = await api.post(`/users/${id}/restore`);
  return response.data;
};

// Get delete info
export const getDeleteInfo = async (id: string) => {
  const response = await api.get(`/users/${id}/delete-info`);
  return response.data;
};


