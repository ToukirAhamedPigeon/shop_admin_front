'use client'

import { motion } from "framer-motion";
import Sidebar from '@/components/module/admin/layout/Sidebar'
import Footer from '@/components/custom/Footer'
import Header from '@/components/module/admin/layout/Header'
import Main from '@/components/module/admin/layout/Main'
import RouteProgress from '@/components/module/admin/layout/RouteProgress'
import { Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  return (
    <>
      <RouteProgress color="#FC39B4" />
      <div className="flex flex-col min-h-screen">
        <Header />

        <div className="flex pt-16">
          <Sidebar />

          <Main>
            {/* Page Animation Wrapper */}
            <motion.div
              key={typeof window !== 'undefined' ? window.location.pathname : "page"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full"
            >
              {/* {children} */}
              <Outlet key={location.pathname} />
            </motion.div>
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
