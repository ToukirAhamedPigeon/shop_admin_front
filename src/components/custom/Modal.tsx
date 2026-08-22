// src/components/custom/Modal.tsx
import React from "react";
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
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25 }}
          className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black/60"
          onClick={onClose}
        >
          <div className="w-full h-full flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
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
    </AnimatePresence>
  );
}