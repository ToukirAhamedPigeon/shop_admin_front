// hooks/useTranslations.ts
import { useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

export const useTranslations = () => {
  const { translations, loading, currentLang } = useSelector(
    (state: RootState) => state.language
  );

  /**
   * Translation helper
   * @param key - translation key (e.g., "login.username")
   * @param fallback - optional fallback if not found
   *
   * Stable between renders (it only changes when the translations do), so it
   * is safe in hook dependency arrays. A new function every render made
   * effects that list `t` refetch on every render, an infinite loop.
   */
  const t = useCallback(
    (key: string, fallback?: string): string => {
      if (translations[key]) return translations[key];
      if (fallback) return fallback;
      return key; // final fallback
    },
    [translations]
  );

  return { t, translations, loading, currentLang };
};
