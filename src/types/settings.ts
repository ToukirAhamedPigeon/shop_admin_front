// D:\shop\shop_admin_front\src\types\settings.ts

export interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  sidebar_bg_image: string | null;
  login_bg_image: string | null;
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
  logo: string | null;
  favicon: string | null;
  footer_text: string;
}

export interface UserSettings {
  theme: ThemeSettings;
  general: GeneralSettings;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SettingsResponse {
  user: UserSettings;
  branding: BrandingSettings;
  lastUpdated: string;
  updatedBy: string;
}

// Update DTOs to include file fields
export interface UpdateThemeSettings {
  primary_color?: string;
  secondary_color?: string;
  dark_mode?: boolean;
  custom_css?: string;
  // File upload fields
  SidebarBgFile?: File;
  LoginBgFile?: File;
  remove_sidebar_bg?: boolean;
  remove_login_bg?: boolean;
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
  footer_text?: string;
  // File upload fields
  LogoFile?: File;
  FaviconFile?: File;
}