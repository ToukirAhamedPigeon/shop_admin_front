export interface User {
  id: string;
  name: string;
  email: string;
  roles?: string[];
  [key: string]: any;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshTokenExpiry: string;
}

export interface RefreshResponse {
  user?: User;
  accessToken: string;
  refreshTokenExpiry: string;
}