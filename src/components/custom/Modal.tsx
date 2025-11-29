// Modal.tsx (Wrapper with full width & height)
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
          className="fixed inset-0 w-full h-full flex items-center justify-center bg-black/50 z-50"
          onClick={onClose} // close on backdrop click
        >
          {/* Full-screen container ensures modal centering */}
          <div className="w-full h-full flex items-center justify-center px-4">
            <ModalCore
              title={title}
              onClose={onClose}
              titleClassName={titleClassName}
              bgColor={bgColor}
              showPrintButton={showPrintButton}
              widthPercent={widthPercent} // now works
            >
              {children}
            </ModalCore>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
