'use client'
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { hideLoader } from "@/redux/slices/loaderSlice";
import Sidebar from '@/components/module/admin/layout/Sidebar'

import Footer from '@/components/custom/Footer'

import Header from '@/components/module/admin/layout/Header'
import Main from '@/components/module/admin/layout/Main'
import RouteProgress from '@/components/module/admin/layout/RouteProgress'

export default function AdminNavbarLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
    useEffect(() => {
    // hide loader once layout is ready
    dispatch(hideLoader());
  }, [dispatch]);
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
