// src/lib/assetUrl.ts

/**
 * Full URL for a file the API stored. Remote storage returns absolute URLs;
 * local storage returns "/uploads/..." paths served by the API host.
 */
export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|data:image\/|blob:)/i.test(path)) return path;
  const base = String(import.meta.env.VITE_API_ASSET_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
