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
