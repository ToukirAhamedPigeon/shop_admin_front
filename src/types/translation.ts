export interface ITranslation {
  id: string;  
  key: string;
  module: string;
  englishValue: string;
  banglaValue: string;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdByName?: string | null;
  updatedByName?: string | null;
}

export interface TranslationFilterRequest {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: string;
  startDate?: string | null;
  endDate?: string | null;
  modules?: string[];
}

export interface CreateTranslationRequest {
  key: string;
  module: string;
  englishValue: string;
  banglaValue: string;
}

export interface UpdateTranslationRequest {
  key: string;
  module: string;
  englishValue: string;
  banglaValue: string;
}

export interface TranslationModuleOption {
  value: string;
  label: string;
}