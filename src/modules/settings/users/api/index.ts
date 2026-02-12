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

export const getUserById = (id: string) =>
  api.get(`/users/${id}`)

