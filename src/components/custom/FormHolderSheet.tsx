// src/components/custom/FormHolderSheet.tsx
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useTranslations } from '@/hooks/useTranslations';

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

  // Accent color based on titleDivClassName
  const getAccentColor = () => {
    if (titleDivClassName?.includes('success')) {
      return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
    }
    if (titleDivClassName?.includes('warning')) {
      return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
    }
    return { bar: 'bg-primary', text: 'text-foreground' };
  };
  const accent = getAccentColor();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col w-full sm:max-w-[50%]",
          "sm:h-screen h-[75vh]",
          "shadow-md bg-background",
          "border-l border-border",
        )}
        style={{
          width: isDesktop ? "50%" : "100%",
          maxWidth: isDesktop ? "50%" : "100%",
          height: isDesktop ? "100%" : "85%",
        }}
      >
        {/* Header */}
        <div
          className={cn(
            "relative flex items-center justify-between px-6 py-4 bg-background border-b border-border",
            titleDivClassName
          )}
        >
          {/* Accent line */}
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.bar}`} />

          <SheetTitle className={`text-2xl font-bold ${accent.text}`}>
            {t(title)}
          </SheetTitle>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Body */}
        <div
          className="overflow-y-auto px-6 pt-6 pb-8"
          style={{ height: "calc(100% - 73px)" }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}