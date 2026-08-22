// src/components/custom/SuccessMessage.tsx
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";

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
        <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-emerald-600 shadow-md">
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
        className="text-3xl font-bold mt-8 text-emerald-600 dark:text-emerald-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {title}
      </motion.h2>

      <motion.p
        className="text-muted-foreground mt-3 text-center max-w-sm"
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
          <Button onClick={onLogin} className="w-full gap-2">
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {onBack && (
          <Button variant="outline" onClick={onBack} className="w-full gap-2">
            <RotateCcw className="w-4 h-4" />
            Send Again
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}