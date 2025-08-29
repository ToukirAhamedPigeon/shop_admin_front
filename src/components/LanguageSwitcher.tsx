import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchTranslations, setLanguage } from "@/redux/slices/languageSlice";

const LanguageSwitcher: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentLang } = useSelector((state: RootState) => state.language);

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) return; // avoid duplicate calls
    localStorage.setItem("lang", lang);
    dispatch(setLanguage(lang));
    dispatch(fetchTranslations(lang));
  };

  return (
    <div className="flex gap-2">
      <button
        className={`px-3 py-1 rounded ${currentLang === "en" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        onClick={() => switchLanguage("en")}
      >
        English
      </button>
      <button
        className={`px-3 py-1 rounded ${currentLang === "bn" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        onClick={() => switchLanguage("bn")}
      >
        বাংলা
      </button>
    </div>
  );
};

export default LanguageSwitcher;
