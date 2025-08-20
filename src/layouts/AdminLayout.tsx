import React from "react";
import { useDispatch } from "react-redux";
import { logoutUser, logoutUserAll, logoutUserOther } from "@/redux/slices/authSlice";
import type { AppDispatch } from "../redux/store"; // <- type-only import
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const handleLogoutOther = () => {
    dispatch(logoutUserOther());
    alert("Logged out from other devices");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between">
        <h1 className="font-bold">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer focus-visible:outline-0">Log Out</DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white text-red-700 min-w-55">
            <DropdownMenuLabel>Log Out</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogoutAll} className="cursor-pointer hover:font-bold">Logout from All Devices</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogoutOther} className="cursor-pointer hover:font-bold">Logout from Other Devices</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:font-bold">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="p-4 flex-1 bg-gray-100">{children}</main>
    </div>
  );
};

export default AdminLayout;
