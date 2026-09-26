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
      return { bar: 'bg-success' };
    }
    if (titleDivClassName?.includes('warning')) {
      return { bar: 'bg-warning' };
    }
    return { bar: 'bg-primary' };
  };
  const accent = getAccentColor();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col w-full sm:max-w-[50%]",
          "sm:h-screen h-[75vh]",
          "shadow-2xl bg-background",
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
            "relative flex items-center justify-between px-6 py-4 bg-card border-b border-border"
          )}
        >
          <SheetTitle className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
            <span className={cn("size-2 rounded-full", accent.bar)} aria-hidden />
            {t(title)}
          </SheetTitle>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
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