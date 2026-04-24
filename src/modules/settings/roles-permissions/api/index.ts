// app/(dashboard)/admin/roles-permissions/api.ts

import api from '@/lib/axios';
import type {
  IRole,
  IPermission,
  RoleFilterRequest,
  PermissionFilterRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest
} from '@/types/role-permission';

// ==================== Role APIs ====================

export const getRoles = async (params: RoleFilterRequest) => {
  const response = await api.post('/roles', params);
  return response.data;
};

export const getRoleById = async (id: string) => {
  const response = await api.get(`/roles/${id}`);
  return response.data;
};

export const getRoleForEdit = async (id: string) => {
  const response = await api.get(`/roles/${id}/edit`);
  return response.data;
};

export const createRole = async (data: CreateRoleRequest) => {
  const response = await api.post('/roles/create', data);
  return response.data;
};

export const updateRole = async (id: string, data: UpdateRoleRequest) => {
  const response = await api.put(`/roles/${id}`, data);
  return response.data;
};

export const deleteRole = async (id: string, permanent: boolean = false) => {
  const response = await api.delete(`/roles/${id}?permanent=${permanent}`);
  return response;
};

export const restoreRole = async (id: string) => {
  const response = await api.post(`/roles/${id}/restore`);
  return response.data;
};

export const getRoleDeleteInfo = async (id: string) => {
  const response = await api.get(`/roles/${id}/delete-info`);
  return response.data;
};

// ==================== Permission APIs ====================

export const getPermissions = async (params: PermissionFilterRequest) => {
  const response = await api.post('/permissions', params);
  return response.data;
};

export const getPermissionById = async (id: string) => {
  const response = await api.get(`/permissions/${id}`);
  return response.data;
};

export const getPermissionForEdit = async (id: string) => {
  const response = await api.get(`/permissions/${id}/edit`);
  return response.data;
};

export const createPermission = async (data: CreatePermissionRequest) => {
  const response = await api.post('/permissions/create', data);
  return response.data;
};

export const updatePermission = async (id: string, data: UpdatePermissionRequest) => {
  const response = await api.put(`/permissions/${id}`, data);
  return response.data;
};

export const deletePermission = async (id: string, permanent: boolean = false) => {
  const response = await api.delete(`/permissions/${id}?permanent=${permanent}`);
  return response;
};

export const restorePermission = async (id: string) => {
  const response = await api.post(`/permissions/${id}/restore`);
  return response.data;
};

export const getPermissionDeleteInfo = async (id: string) => {
  const response = await api.get(`/permissions/${id}/delete-info`);
  return response.data;
};