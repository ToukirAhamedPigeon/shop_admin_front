// src/components/custom/FormHolderSheet.tsx
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useTranslations } from '@/hooks/useTranslations';
import { useAppSelector } from "@/hooks/useRedux";

interface FormHolderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleDivClassName?: string;
  children: ReactNode;
}

export default function FormHolderSheet({
  open,
  onOpenChange,
  title,
  children,
  titleDivClassName
}: FormHolderSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  // Get gradient based on titleDivClassName
  const getHeaderGradient = () => {
    if (titleDivClassName?.includes('success')) {
      return isDarkMode 
        ? 'from-emerald-600 to-teal-700'
        : 'from-emerald-500 to-teal-600';
    }
    if (titleDivClassName?.includes('warning')) {
      return isDarkMode
        ? 'from-amber-600 to-orange-700'
        : 'from-amber-500 to-orange-600';
    }
    return isDarkMode
      ? 'from-blue-600 to-indigo-700'
      : 'from-blue-500 to-indigo-600';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col w-full sm:max-w-[50%]",
          "sm:h-screen h-[75vh]",
          "shadow-2xl",
          "backdrop-blur-xl",
          "border-l border-gray-200/30 dark:border-gray-700/30",
        )}
        style={{
          width: isDesktop ? "50%" : "100%",
          maxWidth: isDesktop ? "50%" : "100%",
          height: isDesktop ? "100%" : "85%",
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        }}
      >
        {/* Header with glass gradient */}
        <div
          className={cn(
            "relative flex items-center justify-between px-6 py-4",
            "backdrop-blur-sm",
            titleDivClassName
          )}
          style={{
            background: `linear-gradient(135deg, ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}, transparent)`,
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          {/* Decorative accent line */}
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getHeaderGradient()}`} />
          
          <SheetTitle className={`text-2xl font-bold bg-gradient-to-r ${getHeaderGradient()} bg-clip-text text-transparent`}>
            {t(title)}
          </SheetTitle>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>

        {/* Body with glass effect */}
        <div
          className="overflow-y-auto px-6 pt-6 pb-8"
          style={{
            height: "calc(100% - 73px)",
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.2)'
              : 'rgba(255, 255, 255, 0.2)',
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}