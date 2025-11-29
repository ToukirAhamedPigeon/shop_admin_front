// components/custom/FormHolderSheet.tsx
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";
import type{ ReactNode } from "react";
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

export default function FormHolderSheet({ open, onOpenChange, title, children,titleDivClassName }: FormHolderSheetProps) {
    const isDesktop = useMediaQuery("(min-width: 640px)");
    const { t } = useTranslations();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="p-0 flex flex-col w-full sm:max-w-[50%] sm:h-screen h-[75vh] shadow-[0_0_10px_rgba(0,0,0,0.25)] sm:shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white via-gray-100 to-white "
        side={isDesktop ? "right" : "bottom"}
        style={{
          width: isDesktop ? "50%" : "100%",
          maxWidth:  isDesktop ? "50%" : "100%",
          height:  isDesktop ? "100%" : "85%",
        }}
      >
        <div
          className={cn(titleDivClassName,"relative flex items-center justify-between px-4 py-3 border-b text-white")}
          style={{
            height: "56px",
          }}
        >
          <SheetTitle className="text-xl font-semibold text-white">{t(title)}</SheetTitle>
          <Button
            variant="link"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-black"
          >
            <X className="h-5 w-5 text-white"/>
          </Button>
        </div>

        <div
          className="overflow-y-auto px-4 pt-4 pb-6"
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
