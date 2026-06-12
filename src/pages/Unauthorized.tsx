import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ShieldOff } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-125px)] text-center px-4">
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="text-8xl font-black tracking-tighter select-none"
          style={{
            background: 'linear-gradient(135deg, #f87171 0%, #f97316 50%, #ef4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          403
        </div>

        <div
          className="p-3 rounded-2xl"
          style={{
            background: 'rgba(220,60,60,0.1)',
            border: '1px solid rgba(220,60,60,0.2)',
          }}
        >
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Unauthorized Access
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
            You don't have permission to view this page.
          </p>
        </div>

        <Button
          asChild
          className="mt-2 rounded-xl h-10 px-6 gap-2 font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            boxShadow: '0 4px 14px rgba(220,60,60,0.3)',
            border: 'none',
            color: '#fff',
          }}
        >
          <Link to="/">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
