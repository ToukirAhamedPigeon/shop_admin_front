// components/custom/FormHolderSheet.tsx

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col w-full sm:max-w-[50%]",
          "sm:h-screen h-[75vh]",
          "shadow-[0_0_10px_rgba(0,0,0,0.25)]",
          "sm:shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.25)]",
          "dark:shadow-[0_0_15px_rgba(0,0,0,0.6)]",
          "bg-gradient-to-br from-white via-gray-100 to-white",
          "dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
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
            "relative flex items-center justify-between px-4 py-3 border-b",
            "bg-white dark:bg-gray-900",
            "border-gray-200 dark:border-gray-700",
            titleDivClassName
          )}
          style={{ height: "56px" }}
        >
          <SheetTitle className="text-xl font-semibold text-gray-100 dark:text-gray-100">
            {t(title)}
          </SheetTitle>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-gray-100 hover:text-black dark:text-gray-100 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div
          className="overflow-y-auto px-4 pt-4 pb-6 text-gray-800 dark:text-gray-200"
          style={{
            height: "calc(100% - 56px)",
          }}
        >
          {children}
        </div>

      </SheetContent>
    </Sheet>
  );
}
