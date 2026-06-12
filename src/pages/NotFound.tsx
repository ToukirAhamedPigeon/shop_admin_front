// NotFound.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-125px)] text-center px-4">
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Large 404 */}
        <div
          className="text-8xl font-black tracking-tighter select-none"
          style={{
            background: 'linear-gradient(135deg, #a0b0f0 0%, #c080f8 50%, #8060e8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          404
        </div>

        <div
          className="p-3 rounded-2xl"
          style={{
            background: 'rgba(120,100,220,0.1)',
            border: '1px solid rgba(120,100,220,0.2)',
          }}
        >
          <AlertCircle className="w-8 h-8 text-indigo-400 dark:text-indigo-300" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button
          asChild
          className="mt-2 rounded-xl h-10 px-6 gap-2 font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, #4060e0 0%, #7040c8 100%)',
            boxShadow: '0 4px 14px rgba(80,80,220,0.3)',
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

export default NotFound;
