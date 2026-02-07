export interface IUserLog {
  id: string;                 // Guid
  detail?: string | null;     // nullable string
  changes?: string | null;    // jsonb (stringified JSON)
  actionType: string;         // required string
  modelName: string;          // required string
  modelId?: string | null;    // Guid?
  createdBy: string;          // Guid
  createdByName: string;          // Guid
  createdAt: string;          // ISO Date string (from backend)
  createdAtId: number;        // long
  ipAddress?: string | null;
  browser?: string | null;
  device?: string | null;
  operatingSystem?: string | null;
  userAgent?: string | null;
}

export interface IUser {
  id: string
  name: string
  username: string
  email: string
  mobileNo?: string
  profileImage?: string
  bio?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  qrCode?: string
  timezone?: string
  language?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  roles: string[]
  permissions: string[]
}
