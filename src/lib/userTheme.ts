// src/lib/userTheme.ts
// Applies the signed-in user's saved theme (App Settings) to the page and
// caches it so index.html can paint it before the app loads.

const STYLE_ID = 'user-theme-colors';
/** CSS built by buildThemeCss, replayed by index.html before first paint. */
export const THEME_CSS_KEY = 'theme-colors-css';
/** The user's saved default ('light' | 'dark'); an explicit header choice ('theme') wins. */
export const THEME_DEFAULT_KEY = 'theme-default';

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode */
    }
  },
  remove: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* private mode */
    }
  },
};

export function applyUserThemeCss(css: string) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!css) {
    el?.remove();
    store.remove(THEME_CSS_KEY);
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  // Keep it last in <head> so it wins over the app stylesheet.
  else if (el !== document.head.lastElementChild) document.head.appendChild(el);
  if (el.textContent !== css) el.textContent = css;
  store.set(THEME_CSS_KEY, css);
}

/** Whether the person picked light/dark themselves (header toggle). */
export const hasExplicitTheme = () => store.get('theme') === 'light' || store.get('theme') === 'dark';

export const saveThemeDefault = (theme: 'light' | 'dark') => store.set(THEME_DEFAULT_KEY, theme);

/** On sign-out: the next person on this browser shouldn't inherit these. */
export function clearUserTheme() {
  document.getElementById(STYLE_ID)?.remove();
  store.remove(THEME_CSS_KEY);
  store.remove(THEME_DEFAULT_KEY);
}
