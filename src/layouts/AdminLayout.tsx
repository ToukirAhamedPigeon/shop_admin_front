'use client'

import Sidebar from '@/components/module/admin/layout/Sidebar'

import Footer from '@/components/custom/Footer'

import Header from '@/components/module/admin/layout/Header'
import Main from '@/components/module/admin/layout/Main'
import RouteProgress from '@/components/module/admin/layout/RouteProgress'

export default function AdminNavbarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteProgress color="#FC39B4" />
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        {/* Layout Body */}
        <div className="flex pt-16">
          <Sidebar />
          <Main>
            {children}
          </Main>
        </div>

        <Footer
        footerClasses="w-full py-1 text-center px-4 text-xs text-gray-600 bg-transparent border-t border-gray-200 overflow-hidden flex justify-center md:justify-end"
        linkClasses="text-red-600 hover:underline"
        showVersion={true}
      />
      </div>
      </>
  )
}


// import React from "react";
// import { useDispatch } from "react-redux";
// import { logoutUser, logoutUserAll, logoutUserOther } from "@/redux/slices/authSlice";
// import type { AppDispatch } from "../redux/store"; // <- type-only import
// import { useNavigate } from "react-router-dom";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     dispatch(logoutUser());
//     navigate("/login", { replace: true });
//   };

//   const handleLogoutAll = () => {
//     dispatch(logoutUserAll());
//     navigate("/login", { replace: true });
//   };
//   const handleLogoutOther = () => {
//     dispatch(logoutUserOther());
//     alert("Logged out from other devices");
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       <header className="bg-gray-800 text-white p-4 flex justify-between">
//         <h1 className="font-bold">Dashboard</h1>
//         <DropdownMenu>
//           <DropdownMenuTrigger className="cursor-pointer focus-visible:outline-0">Log Out</DropdownMenuTrigger>
//           <DropdownMenuContent className="bg-white text-red-700 min-w-55">
//             <DropdownMenuLabel>Log Out</DropdownMenuLabel>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem onClick={handleLogoutAll} className="cursor-pointer hover:font-bold">Logout from All Devices</DropdownMenuItem>
//             <DropdownMenuItem onClick={handleLogoutOther} className="cursor-pointer hover:font-bold">Logout from Other Devices</DropdownMenuItem>
//             <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:font-bold">Logout</DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </header>
//       <main className="p-4 flex-1 bg-gray-100">{children}</main>
//     </div>
//   );
// };

// export default AdminLayout;
