// src/components/custom/ModalCore.tsx
import React, { useRef } from "react";
import { motion } from "framer-motion";
import { X, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

type ModalCoreProps = {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
  bgColor?: string;
  showPrintButton?: boolean;
  widthPercent?: number;
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 8 },
};

const ModalCore: React.FC<ModalCoreProps> = ({
  onClose,
  title,
  children,
  titleClassName,
  bgColor = "white",
  showPrintButton = true,
  widthPercent,
}) => {
  const { t } = useTranslations();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;

    const win = window.open("", "", "width=800,height=600");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${t(title)}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #f9fafb; }
            img { max-width: 100%; height: auto; margin-bottom: 20px; }
            h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #1f2937; }
          </style>
        </head>
        <body>
          <h2>${t(title)}</h2>
          ${html}
          <script> window.onload = () => window.print(); </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-xl shadow-2xl overflow-hidden border border-border",
        bgColor === "transparent" ? "bg-transparent" : "bg-card"
      )}
      style={{
        display: "flex",
        flexDirection: "column",
        width: widthPercent ? `${widthPercent}%` : "100%",
        // Never wider than the screen; the old fixed 320px minimum overflowed small phones.
        minWidth: "min(320px, 100%)",
        maxWidth: "min(90vw, 100%)",
      }}
    >
      {/* Header */}
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-card",
          "border-b border-border",
          titleClassName
        )}
      >
        <h2 className="min-w-0 truncate text-lg font-semibold text-foreground">
          {t(title)}
        </h2>

        <div className="flex items-center gap-2">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              aria-label={t("common.print", "Print")}
              title={t("common.print", "Print")}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors hover:bg-accent"
            >
              <Printer size={18} />
            </button>
          )}

          <button
            onClick={onClose}
            aria-label={t("common.close", "Close")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors hover:bg-accent"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="px-4 py-4 overflow-y-auto overflow-x-auto sm:px-6"
        style={{ flexGrow: 1, maxHeight: "calc(90vh - 80px)" }}
        ref={printRef}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default ModalCore;