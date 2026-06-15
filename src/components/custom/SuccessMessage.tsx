// src/components/custom/SuccessMessage.tsx
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";
import { useAppSelector } from "@/hooks/useRedux";

interface SuccessMessageProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  onLogin?: () => void;
}

export default function SuccessMessage({
  title = "Success!",
  message = "Your operation completed successfully.",
  onBack,
  onLogin
}: SuccessMessageProps) {
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col justify-center items-center p-8"
    >
      {/* Animated Circle with Checkmark */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl">
          <motion.div
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1, rotate: -90 }}
            transition={{ duration: 0.6, ease: "easeInOut", delay: 0.4 }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h2
        className="text-3xl font-bold mt-8 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {title}
      </motion.h2>

      <motion.p
        className="text-gray-600 dark:text-gray-300 mt-3 text-center max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {message}
      </motion.p>

      {/* Buttons */}
      <motion.div
        className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {onLogin && (
          <Button
            onClick={onLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 gap-2"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Send Again
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}