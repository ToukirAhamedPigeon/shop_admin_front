// hooks/useTranslations.ts
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
   */
  const t = (key: string, fallback?: string): string => {
    if (translations[key]) return translations[key];
    if (fallback) return fallback;
    return key; // final fallback
  };

  return { t, translations, loading, currentLang };
};
