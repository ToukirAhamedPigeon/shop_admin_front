import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/useTranslations';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
  bgColor?: string;
  showPrintButton?: boolean; // Optional prop for print button
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  titleClassName,
  bgColor = 'white',
  showPrintButton = true,
}) => {
  const { t } = useTranslations();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const newWindow = window.open('', '', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${t(title)}</title>
            <style>
              body {
                font-family: sans-serif;
                padding: 20px;
              }
              img {
                max-width: 100%;
                height: auto;
                margin-bottom: 20px;
              }
              h2 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
              }
            </style>
          </head>
          <body>
            <h2>${t(title)}</h2>
            ${printContents}
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 pt-[50px] flex items-start justify-center bg-black/50 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative rounded-md border border-gray-300 shadow-2xl w-full max-w-3xl max-h-[calc(100vh-100px)] bg-white overflow-hidden',
          bgColor === 'transparent'
            ? 'bg-transparent'
            : 'bg-gradient-to-t from-[#fdfbfb] via-white to-[#ebedee]'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* Sticky Header */}
        <div
          className={cn(
            'sticky top-0 z-10 bg-white border-b border-gray-300 flex items-center justify-between px-6 py-4',
            titleClassName
          )}
        >
          <h2 className="text-xl font-semibold text-gray-800">{t(title)}</h2>
          <div className="flex items-center gap-2">
            {showPrintButton && (
              <button
                onClick={handlePrint}
                className="text-gray-500 hover:text-gray-700 transition cursor-pointer"
                aria-label="Print modal"
              >
                <Printer size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
              aria-label="Close modal"
            >
              <X className="cursor-pointer" size={24} />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div
          className="px-6 py-4 overflow-y-auto"
          style={{ flexGrow: 1, maxHeight: 'calc(100vh - 150px)' }}
          ref={printRef}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Modal;
