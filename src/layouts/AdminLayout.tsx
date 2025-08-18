import React from "react";
import { useDispatch } from "react-redux";
import { logoutUser, logoutUserAll } from "@/redux/slices/authSlice";
import type { AppDispatch } from "../redux/store"; // <- type-only import
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  const handleLogoutAll = () => {
    dispatch(logoutUserAll());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between">
        <h1 className="font-bold">Dashboard</h1>
        <Button onClick={handleLogoutAll}>Logout from All Devices</Button>
        <Button onClick={handleLogout}>Logout</Button>
      </header>
      <main className="p-4 flex-1 bg-gray-100">{children}</main>
    </div>
  );
};

export default AdminLayout;
