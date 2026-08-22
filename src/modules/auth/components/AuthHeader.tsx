// src/components/module/auth/AuthHeader.tsx
import LanguageSwitcher from '@/components/custom/LanguageSwitcher';
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton';

export default function AuthHeader() {
  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-card border border-border shadow-sm">
        <LanguageSwitcher />
        <ThemeToggleButton />
      </div>
    </div>
  );
}
