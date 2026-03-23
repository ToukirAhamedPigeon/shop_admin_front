export interface IRole {
  id: string;
  name: string;
  guardName: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

export interface IPermission {
  id: string;
  name: string;
  guardName: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface RoleFilterRequest {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: string;
  isActiveStr?: string;
  isDeletedStr?: string;
}

export interface PermissionFilterRequest {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: string;
  isActiveStr?: string;
  isDeletedStr?: string;
}

export interface CreateRoleRequest {
  names: string;
  guardName: string;
  permissions: string[];
  isActive?: string;
}

export interface UpdateRoleRequest {
  name: string;
  guardName: string;
  permissions: string[];
  isActive?: string;
}

export interface CreatePermissionRequest {
  names: string;
  guardName: string;
  roles: string[];
  isActive?: string;
}

export interface UpdatePermissionRequest {
  name: string;
  guardName: string;
  roles: string[];
  isActive?: string;
}