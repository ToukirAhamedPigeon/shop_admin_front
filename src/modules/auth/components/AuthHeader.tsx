// src/components/module/auth/AuthHeader.tsx
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/components/custom/LanguageSwitcher';
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton';
import { useAppSelector } from '@/hooks/useRedux';

export default function AuthHeader() {
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  return (
    <motion.div
      className="fixed top-6 right-6 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-full backdrop-blur-md transition-all duration-300"
        style={{
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.6)'
            : 'rgba(255, 255, 255, 0.5)',
          border: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: isDarkMode
            ? '0 4px 15px rgba(0, 0, 0, 0.2)'
            : '0 4px 15px rgba(0, 0, 0, 0.05)',
        }}
      >
        <LanguageSwitcher />
        <ThemeToggleButton />
      </div>
    </motion.div>
  );
}