// src/components/module/auth/AuthHeader.tsx
import LanguageSwitcher from '@/components/custom/LanguageSwitcher';
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton';

export default function AuthHeader() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggleButton />
      </div>
    </div>
  );
}
