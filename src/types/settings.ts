// D:\shop\shop_admin_front\src\types\settings.ts
export interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  sidebar_bg_image: string;
  login_bg_image: string;
  dark_mode: boolean;
  custom_css: string;
}

export interface GeneralSettings {
  default_language: string;
  timezone: string;
  date_format: string;
  time_format: string;
  currency: string;
}

export interface BrandingSettings {
  app_name: string;
  logo: string;
  favicon: string;
  footer_text: string;
}

export interface UserSettings {
  theme: ThemeSettings;
  general: GeneralSettings;
  updatedAt: string;
  updatedBy: string;
}

export interface SettingsResponse {
  user: UserSettings;
  branding: BrandingSettings;
  lastUpdated: string;
  updatedBy: string;
}

export interface UpdateThemeSettings {
  primary_color?: string;
  secondary_color?: string;
  sidebar_bg_image?: string;
  login_bg_image?: string;
  dark_mode?: boolean;
  custom_css?: string;
}

export interface UpdateGeneralSettings {
  default_language?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  currency?: string;
}

export interface UpdateBrandingSettings {
  app_name?: string;
  logo?: string;
  favicon?: string;
  footer_text?: string;
}