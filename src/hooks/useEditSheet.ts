// hooks/useEditModal.ts
import { useState } from "react";

export function useEditSheet<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);

  const openEdit = (item: T) => {
    setItemToEdit(item);
    setIsOpen(true);
  };

  const closeEdit = () => {
    setItemToEdit(null);
    setIsOpen(false);
  };

  return {
    isOpen,
    itemToEdit,
    openEdit,
    closeEdit,
  };
}
