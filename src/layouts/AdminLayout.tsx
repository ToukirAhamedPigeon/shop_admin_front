'use client'

import { motion } from "framer-motion";
import Sidebar from '@/components/module/admin/layout/Sidebar'
import Footer from '@/components/custom/Footer'
import Header from '@/components/module/admin/layout/Header'
import Main from '@/components/module/admin/layout/Main'
import { Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />

        <div className="flex pt-16">
          <Sidebar />

          <Main>
            {/* Page Animation Wrapper */}
            <motion.div
              key={typeof window !== 'undefined' ? window.location.pathname : "page"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {/* {children} */}
              <Outlet key={location.pathname} />
            </motion.div>
          </Main>
        </div>

        <Footer
          footerClasses="w-full py-2 text-center px-4 text-xs text-muted-foreground bg-background border-t border-border overflow-hidden flex justify-center md:justify-end"
          linkClasses="text-foreground hover:text-primary hover:underline"
          showVersion={true}
        />
      </div>
    </>
  )
}
