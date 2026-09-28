// src/lib/userCss.ts
// Everything from the Theme settings that becomes CSS: colours (themeColors),
// the sidebar background image and the person's own custom CSS.
import type { ThemeSettings } from '@/types/settings';
import { buildThemeCss } from './themeColors';
import { assetUrl } from './assetUrl';

const MAX_CUSTOM_CSS = 20_000;

/** Only images we can vouch for: data images, this site, and the API's asset host. */
function allowedUrl(raw: string): boolean {
  const u = raw.trim();
  if (/^data:image\//i.test(u)) return true;
  if (u.startsWith('/') && !u.startsWith('//')) return true;
  const asset = assetUrl('/');
  try {
    const origin = new URL(u, window.location.href).origin;
    return origin === window.location.origin || (!!asset && origin === new URL(asset).origin);
  } catch {
    return false;
  }
}

/**
 * Custom CSS is the person's own and only affects their own screen, but it
 * still shouldn't pull in other sites (tracking, @import chains) or run
 * script-like features from old browsers.
 */
export function sanitizeCustomCss(css: string): string {
  return css
    .slice(0, MAX_CUSTOM_CSS)
    .replace(/<\/?style[^>]*>/gi, '')
    .replace(/@import[^;]*;?/gi, '/* @import removed */')
    .replace(/@charset[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, '(')
    .replace(/(javascript|vbscript)\s*:/gi, '')
    .replace(/(behavior|-moz-binding)\s*:/gi, 'x-removed:')
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, _q, u: string) => (allowedUrl(u) ? match : 'none'));
}

const cssString = (s: string) => `"${s.replace(/["\\\n\r]/g, (c) => (c === '"' ? '\\"' : c === '\\' ? '\\\\' : ''))}"`;

export function buildUserCss(theme: ThemeSettings): string {
  const parts = [buildThemeCss(theme.primary_color, theme.secondary_color)];

  const sidebar = assetUrl(theme.sidebar_bg_image);
  if (sidebar && /^(https?:|\/)/i.test(sidebar)) {
    // Under the brand navy, so menu text keeps its contrast.
    parts.push(
      `html .app-sidebar:not(.app-sidebar--top){background:linear-gradient(180deg,oklch(0.18 0.035 272 / 0.84),oklch(0.15 0.03 272 / 0.92)),url(${cssString(sidebar)}) center / cover no-repeat;}`
    );
  }

  const custom = sanitizeCustomCss(theme.custom_css || '').trim();
  if (custom) parts.push(`/* Custom CSS (App Settings) */\n${custom}`);

  return parts.filter(Boolean).join('\n');
}
