// src/components/custom/LanguageSwitcher.tsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchTranslations, setLanguage } from "@/redux/slices/languageSlice";
import { Globe } from "lucide-react";

const LanguageSwitcher: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentLang } = useSelector((state: RootState) => state.language);

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
    <button
      type="button"
      onClick={() => switchLanguage(nextLang)}
      className="header-icon-btn w-auto gap-1.5 px-2.5"
      aria-label={nextLang === "bn" ? "Switch to Bangla" : "Switch to English"}
      title={nextLang === "bn" ? "বাংলা" : "English"}
    >
      <Globe className="size-4" />
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </button>
  );
};

export default LanguageSwitcher;