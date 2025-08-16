import React from "react";

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

export default AuthLayout;
