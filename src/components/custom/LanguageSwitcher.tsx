import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchTranslations, setLanguage } from "@/redux/slices/languageSlice";
import { Button } from "@/components/ui/button"; // shadcn/ui Button

const LanguageSwitcher: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentLang } = useSelector((state: RootState) => state.language);

  // Toggle language between English and Bangla
  const nextLang = currentLang === "en" ? "bn" : "en";
  const label = nextLang.toUpperCase();

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) return;

    // ✅ Update local storage and state
    localStorage.setItem("lang", lang);
    dispatch(setLanguage(lang));

    // ✅ Fetch translations and bypass cache
    dispatch(fetchTranslations({ lang, forceFetch: true }));
  };

  return (
    <Button
      variant="link"
      onClick={() => switchLanguage(nextLang)}
      className="text-sm text-white hover:text-blue-500 transition-colors cursor-pointer"
    >
      {label}
    </Button>
  );
};

export default LanguageSwitcher;
