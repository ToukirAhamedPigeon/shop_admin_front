import api from "@/lib/axios";
import { ForgotPasswordApi, ResetPasswordApi, ValidateResetTokenApi } from "@/routes/api";

export const requestPasswordReset = async (email: string) => {
  return api.post(ForgotPasswordApi.url, email);
};

export const validateToken = async (token: string) => {
  return api.get(`${ValidateResetTokenApi.url}/${token}`);
};

export const resetPassword = async (token: string, password: string) => {
  return api.post(ResetPasswordApi.url, { token, password });
};
