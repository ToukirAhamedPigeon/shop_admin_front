// src/modules/documentation/types/index.ts

// ================= Developer Guide Tree =================
export interface DocTreeNode {
  name: string;
  slug: string;
  isFile: boolean;
  children?: DocTreeNode[];
}

// ================= Developer Guide Page =================
export interface DocPage {
  title: string;
  markdown: string;
  sourcePaths: string[];
  updatedAt: string;
}

// ================= User Guide =================
export interface UserGuide {
  title: string;
  markdown: string;
  role: string;
  updatedAt: string;
}

// ================= Changelog =================
// Field names match the backend's ChangelogEntryDto/PagedChangelogDto exactly
// (Shared.Application/DTOs/Documentation) — camelCase per ASP.NET's default JSON serialization.
export interface ChangelogEntry {
  sha: string;
  repo: string;
  date: string;
  summary?: string;
  author?: string;
  files?: string[];
}

export interface ChangelogFilterRequest {
  page?: number;
  pageSize?: number;
  repo?: string;
}

export interface ChangelogResponse {
  items: ChangelogEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
}
