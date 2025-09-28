// routes/api.ts

// ================================
// API INDEX (AUTO-GENERATED PROMPT)
// Use this comment to regenerate API list whenever APIs are added or deleted
// Format: [SL] Section > Sub-section > API Name : HTTP_METHOD /endpoint
// ================================

// [1] AUTH > CSRF > Fetch CSRF Token : GET /csrf/token
// [2] AUTH > LOGIN > Login : POST /auth/login
// [3] AUTH > TOKEN > Refresh Access Token : POST /auth/refresh
// [4] AUTH > LOGOUT > Logout Current Session : POST /auth/logout
// [5] AUTH > LOGOUT > Logout All Sessions : POST /auth/logout-all
// [6] AUTH > LOGOUT > Logout Other Sessions : POST /auth/logout-others
// [7] SETTINGS > LANGUAGES > Fetch Translations : GET /translations/get

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type DataType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';

export interface PayloadField {
  name: string;
  type: DataType;
  required?: boolean; 
  description?: string;
}

export interface ResponseField {
  name: string;
  type: DataType;
  description?: string;
}

export interface ApiDefinition {
  url: string;                 // endpoint path without base URL
  method: HttpMethod;
  description?: string;
  permissions?: string[];      // array of required permissions
  relationType?: 'AND' | 'OR'; // default OR
  payload?: PayloadField[];    // request body fields (if any)
  response?: ResponseField[];  // response fields
}

// AUTH 

export const FetchCsrfTokenApi: ApiDefinition = {
  url: "/csrf/token",
  method: "GET",
  description: "Fetch CSRF token for secure requests",
  permissions: [],
  response: [{ name: "csrfToken", type: "string" }],
};

export const LoginApi: ApiDefinition = {
  url: "/auth/login",
  method: "POST",
  description: "Login a user",
  permissions: [],
  payload: [
    { name: "identifier", type: "string", required: true },
    { name: "password", type: "string", required: true },
  ],
  response: [
    { name: "user", type: "object" },
    { name: "accessToken", type: "string" },
    { name: "refreshTokenExpiry", type: "string" },
  ],
};

export const RefreshApi: ApiDefinition = {
  url: "/auth/refresh",
  method: "POST",
  description: "Refresh access token",
  permissions: [],
  response: [
    { name: "user", type: "object" },
    { name: "accessToken", type: "string" },
    { name: "refreshTokenExpiry", type: "string" },
  ],
};

export const LogoutApi: ApiDefinition = {
  url: "/auth/logout",
  method: "POST",
  description: "Logout current session",
  permissions: [],
};

export const LogoutAllApi: ApiDefinition = {
  url: "/auth/logout-all",
  method: "POST",
  description: "Logout all sessions",
  permissions: [],
};

export const LogoutOthersApi: ApiDefinition = {
  url: "/auth/logout-others",
  method: "POST",
  description: "Logout all sessions except current",
  permissions: [],
};

// AUTH 

// Settings

// // Languages
export const FetchTranslationsApi = {
  url: "/translations/get",
  method: "GET" as const,
  description: "Fetch translations for a given language",
  payload: [
    { name: "lang", type: "string", required: true },
    { name: "forceFetch", type: "boolean", required: false },
  ],
  response: [
    { name: "translations", type: "object" },
  ],
};
// // Languages

// Settings
