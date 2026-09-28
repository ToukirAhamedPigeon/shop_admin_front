// src/components/UserThemeSync.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchSettings } from '@/redux/slices/settingsSlice';
import { applyDefaultTheme } from '@/redux/slices/themeSlice';
import { buildUserCss } from '@/lib/userCss';
import { assetUrl } from '@/lib/assetUrl';
import { applyUserThemeCss, hasExplicitTheme, saveLoginBackground, saveThemeDefault } from '@/lib/userTheme';

/**
 * Applies the Theme settings saved in App Settings: colours, dark-mode
 * default, sidebar background, custom CSS and the sign-in background.
 * Mounted once in the admin layout; renders nothing.
 */
export default function UserThemeSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const theme = useAppSelector((s) => s.settings.data?.user?.theme);

  // Load this person's settings (again when the account changes).
  useEffect(() => {
    if (userId) dispatch(fetchSettings());
  }, [dispatch, userId]);

  useEffect(() => {
    if (!theme) return;
    applyUserThemeCss(buildUserCss(theme));
    // Shown on the sign-in page, which is only seen signed out.
    saveLoginBackground(assetUrl(theme.login_bg_image));

    const preferred = theme.dark_mode ? 'dark' : 'light';
    saveThemeDefault(preferred);
    // The header's sun/moon choice, once made, wins over the saved default.
    if (!hasExplicitTheme()) dispatch(applyDefaultTheme(preferred));
  }, [dispatch, theme]);

  return null;
}
