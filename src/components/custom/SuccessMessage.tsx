import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col justify-center items-center p-6"
    >
      {/* Animated Circle */}
      <motion.div
        className="w-32 h-32 flex items-center justify-center rounded-full bg-green-500 shadow-xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
      >
        {/* Animated Checkmark */}
        <motion.svg
          width="70"
          height="70"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut", delay: 0.3 }}
        >
          <path d="M20 6L9 17L4 12" />
        </motion.svg>
      </motion.div>

      <motion.h2
        className="text-2xl font-bold mt-6 text-gray-900 dark:text-gray-100"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {title}
      </motion.h2>

      <motion.p
        className="text-gray-600 dark:text-gray-300 mt-2 text-center max-w-xs"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        {message}
      </motion.p>

      {/* Buttons */}
      <motion.div
        className="mt-6 flex flex-col gap-3 w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {onLogin && (
          <Button
            onClick={onLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Login
          </Button>
        )}

        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            Send Again
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
