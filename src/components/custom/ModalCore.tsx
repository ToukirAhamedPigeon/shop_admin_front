// ModalCore.tsx
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
  widthPercent?: number; // optional width for desktop
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -20 },
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
            body { font-family: sans-serif; padding: 20px; }
            img { max-width: 100%; height: auto; margin-bottom: 20px; }
            h2 { font-size: 1.5rem; margin-bottom: 1rem; }
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
      transition={{ duration: 0.25 }}
      className={cn(
        "relative rounded-md border border-gray-300 dark:border-gray-700 shadow-2xl overflow-hidden",
        bgColor === "transparent"
          ? "bg-transparent dark:bg-transparent"
          : "bg-gradient-to-t from-[#fdfbfb] via-white to-[#ebedee] dark:bg-[#1b2a3f]"
      )}
      style={{
        display: "flex",
        flexDirection: "column",
        width: widthPercent ? `${widthPercent}%` : "100%", // default full width on mobile
        //maxWidth: "900px", // max width for large screens
        minWidth: "280px", // prevent too small modal
      }}
    >
      {/* Header */}
      <div
        className={cn(
          "sticky top-0 z-10 bg-white border-b border-gray-300 dark:border-gray-700 dark:bg-[#1b2a3f] flex items-center justify-between px-6 py-4",
          titleClassName
        )}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white dark:bg-[#1b2a3f]">{t(title)}</h2>

        <div className="flex items-center gap-2">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              className="text-gray-500 hover:text-blue-700 dark:text-white dark:hover:text-blue-300 transition cursor-pointer"
            >
              <Printer size={20} />
            </button>
          )}

          <button
            onClick={onClose}
            className="text-gray-500 transition cursor-pointer hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="px-6 py-4 overflow-y-auto dark:bg-[#1b2a3f]"
        style={{ flexGrow: 1, maxHeight: "calc(100vh - 150px)" }}
        ref={printRef}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default ModalCore;
