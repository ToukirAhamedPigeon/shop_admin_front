// apis/auth.ts
import api from "@/lib/axios";
import {
  FetchCsrfTokenApi,
  LoginApi,
  RefreshApi,
  LogoutApi,
  LogoutAllApi,
  LogoutOthersApi,
  VerifyEmailApi,
} from "@/routes/api";
import type {LoginResponse, RefreshResponse} from "./../types"

// Types for API responses
export const fetchCsrfTokenApi = async (): Promise<{ csrfToken: string }> => {
    const response = await api.get(FetchCsrfTokenApi.url, { withCredentials: true });
    return response.data; // { csrfToken: string }
};

export const loginApi = async (credentials: { identifier: string; password: string }): Promise<LoginResponse> => {
  const response = await api.post(LoginApi.url, credentials, { withCredentials: true });
  return response.data;
};

export const refreshApi = async (): Promise<RefreshResponse> => {
  const response = await api.post(RefreshApi.url, {}, { withCredentials: true });
  return response.data;
};

export const logoutApi = async (): Promise<void> => {
  await api.post(LogoutApi.url, {}, { withCredentials: true });
};

export const logoutAllApi = async (): Promise<void> => {
  await api.post(LogoutAllApi.url, {}, { withCredentials: true });
};

export const logoutOthersApi = async (): Promise<void> => {
  await api.post(LogoutOthersApi.url, {}, { withCredentials: true });
};

export const verifyEmail = async (token: string) => {
  return api.get(`${VerifyEmailApi.url}?token=${token}`);
};