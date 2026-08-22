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
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -20 },
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
      transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "relative rounded-2xl shadow-md overflow-hidden border border-border",
        bgColor === "transparent" ? "bg-transparent" : "bg-card"
      )}
      style={{
        display: "flex",
        flexDirection: "column",
        width: widthPercent ? `${widthPercent}%` : "100%",
        minWidth: "320px",
        maxWidth: "90vw",
      }}
    >
      {/* Header */}
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-card",
          "border-b border-border",
          titleClassName
        )}
      >
        <h2 className="text-xl font-bold text-foreground">
          {t(title)}
        </h2>

        <div className="flex items-center gap-2">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors hover:bg-accent"
            >
              <Printer size={18} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors hover:bg-accent"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="px-6 py-4 overflow-y-auto"
        style={{ flexGrow: 1, maxHeight: "calc(90vh - 80px)" }}
        ref={printRef}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default ModalCore;