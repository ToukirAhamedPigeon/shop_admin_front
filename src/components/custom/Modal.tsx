// src/components/custom/Modal.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import ModalCore from "./ModalCore";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
  bgColor?: string;
  showPrintButton?: boolean;
  widthPercent?: number;
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  titleClassName,
  bgColor,
  showPrintButton,
  widthPercent,
}: ModalProps) {
  // Esc closes, like the other dialogs.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Portal to <body>: inside <main> the modal shared main's stacking context,
  // so the sidebar and header were drawn over its edges.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.18 }}
          className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black/40"
        >
          {/* Clicking the dimmed area around the modal closes it. */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full h-full flex items-center justify-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <ModalCore
              title={title}
              onClose={onClose}
              titleClassName={titleClassName}
              bgColor={bgColor}
              showPrintButton={showPrintButton}
              widthPercent={widthPercent}
            >
              {children}
            </ModalCore>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}