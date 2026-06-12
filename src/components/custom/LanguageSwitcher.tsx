// src/components/custom/LanguageSwitcher.tsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchTranslations, setLanguage } from "@/redux/slices/languageSlice";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageSwitcher: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentLang } = useSelector((state: RootState) => state.language);
  const isDarkMode = useSelector((state: RootState) => state.theme.current) === 'dark';

  // Toggle language between English and Bangla
  const nextLang = currentLang === "en" ? "bn" : "en";
  const label = nextLang.toUpperCase();

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) return;

    localStorage.setItem("lang", lang);
    dispatch(setLanguage(lang));
    dispatch(fetchTranslations({ lang, forceFetch: true }));
  };

  return (
    <Button
      variant="ghost"
      onClick={() => switchLanguage(nextLang)}
      className={`flex items-center gap-1.5 px-2 py-1 h-8 rounded-md transition-all duration-200 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 hover:text-emerald-300' 
          : 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 hover:from-emerald-500/25 hover:to-teal-500/25 hover:text-emerald-700'
      }`}
    >
      <Globe className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
};

export default LanguageSwitcher;