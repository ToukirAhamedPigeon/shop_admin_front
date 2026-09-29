export interface IRole {
  id: string;
  name: string;
  guardName: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  /** Permission groups given to the role; their permissions apply too. */
  groups?: string[];
}

/** A named bundle of permissions, given to roles or users (shop_back PermissionGroup). */
export interface IPermissionGroup {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  permissions: string[];
  /** Roles that have the group. */
  roles: string[];
  /** Users given the group directly. */
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavePermissionGroupRequest {
  name: string;
  description?: string;
  isActive: string;
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
  permissions?: string[];
}

export interface PermissionFilterRequest {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: string;
  isActiveStr?: string;
  isDeletedStr?: string;
  roles?: string[];
}

export interface CreateRoleRequest {
  names: string;
  guardName: string;
  permissions: string[];
  isActive?: string;
  groups?: string[];
}

export interface UpdateRoleRequest {
  name: string;
  guardName: string;
  permissions: string[];
  isActive?: string;
  groups?: string[];
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