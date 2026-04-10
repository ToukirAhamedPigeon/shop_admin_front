export interface IOption {
  id: string;
  name: string;
  parentId: string | null;
  parentName?: string;
  hasChild: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
  deletedByName?: string;
}

export interface OptionFilterRequest {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: string;
  isActiveStr?: string;
  isDeletedStr?: string;
  createdFrom?: string;
  createdTo?: string;
  parentId?: string | null;
}

export interface CreateOptionRequest {
  names: string;
  parentId?: string | null;
  hasChild: string;
  isActive?: string;
}

export interface UpdateOptionRequest {
  name: string;
  parentId?: string | null;
  hasChild: string;
  isActive?: string;
}

export interface DeleteOptionInfo {
  canBePermanent: boolean;
  message: string;
  hasChildren: boolean;
  childrenCount: number;
}