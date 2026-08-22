// src/modules/documentation/api/index.ts
import api from '@/lib/axios';
import type {
  DocTreeNode,
  DocPage,
  UserGuide,
  ChangelogFilterRequest,
  ChangelogResponse,
} from '../types';

// Get the nested file/folder tree for the Developer Guide sidebar
export const getDeveloperTree = async (): Promise<DocTreeNode[]> => {
  const response = await api.get('/documentation/developer/tree');
  return response.data;
};

// Get a single Developer Guide page by its slug
export const getDeveloperPage = async (slug: string): Promise<DocPage> => {
  const response = await api.get('/documentation/developer/page', {
    params: { slug },
  });
  return response.data;
};

// Get the current user's role-specific User Guide
export const getUserGuide = async (): Promise<UserGuide> => {
  const response = await api.get('/documentation/user-guide');
  return response.data;
};

// Get a paginated list of changelog entries
export const getChangelog = async (
  params: ChangelogFilterRequest
): Promise<ChangelogResponse> => {
  const response = await api.get('/documentation/changelog', { params });
  return response.data;
};
