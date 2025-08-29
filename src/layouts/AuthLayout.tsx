import React from "react";
import LanguageSwitcher from "../components/LanguageSwitcher";

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <LanguageSwitcher />
      {children}
    </div>
  );
};

export default AuthLayout;
