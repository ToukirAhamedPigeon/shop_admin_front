// src/components/custom/FormHolderSheet.tsx
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { X, type LucideIcon } from "lucide-react";
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
  /** One line under the title. */
  description?: string;
  /** Shown in a tinted tile before the title. */
  icon?: LucideIcon;
  children: ReactNode;
}

export default function FormHolderSheet({
  open,
  onOpenChange,
  title,
  children,
  titleDivClassName,
  description,
  icon: Icon,
}: FormHolderSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { t } = useTranslations();

  // Accent color based on titleDivClassName
  const getAccentColor = () => {
    if (titleDivClassName?.includes('success')) {
      return { bar: 'bg-success', tile: 'bg-success/10 text-success' };
    }
    if (titleDivClassName?.includes('warning')) {
      return { bar: 'bg-warning', tile: 'bg-warning/10 text-warning' };
    }
    return { bar: 'bg-primary', tile: 'bg-primary/10 text-primary' };
  };
  const accent = getAccentColor();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col w-full sm:max-w-none",
          "sm:h-screen h-[75vh]",
          "shadow-2xl bg-background",
          "border-l border-border",
        )}
        style={{
          // Half the screen on wide displays, but never narrower than a form needs.
          width: isDesktop ? "max(50%, min(760px, 100%))" : "100%",
          maxWidth: "100%",
          height: isDesktop ? "100%" : "85%",
        }}
      >
        {/* Header */}
        <div
          className={cn(
            "relative flex items-center justify-between gap-3 px-6 py-4 bg-card border-b border-border"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            {Icon ? (
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", accent.tile)} aria-hidden>
                <Icon className="size-[18px]" />
              </span>
            ) : (
              <span className={cn("size-2 shrink-0 rounded-full", accent.bar)} aria-hidden />
            )}
            <div className="min-w-0">
              <SheetTitle className="truncate text-lg font-semibold text-foreground">{t(title)}</SheetTitle>
              {description && <SheetDescription className="truncate text-xs text-muted-foreground">{t(description)}</SheetDescription>}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label={t("Close")}
            className="shrink-0 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        {/* The padding sits on an inner box: Chrome insets sticky elements by
            the scroller's own padding, so a sticky footer would float above it. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-6 pt-6 pb-8">{children}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}