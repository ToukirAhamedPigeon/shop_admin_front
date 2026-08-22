// src/modules/documentation/utils.ts
import axios from 'axios';

// Extract a human-readable message from an API error, falling back to a
// provided default. Keeps pages free of `any`-typed catch clauses.
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
};
