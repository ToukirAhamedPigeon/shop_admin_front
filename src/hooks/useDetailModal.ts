import { useState } from 'react';
import api from '@/lib/axios';


export function useDetailModal<T extends { id: string }>(endpoint: string) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDetail = async (itemOrId: T | string) => {
    setIsModalOpen(true);
  
    if (typeof itemOrId === 'object' && itemOrId !== null) {
      // If a full object is passed, use it directly
      setSelectedItem(itemOrId);
      return;
    }
  
    // Otherwise treat it as an ID string and fetch data from API
    setDetailLoading(true);
    try {
      const res = await api.get(`${endpoint}/${itemOrId}`, {
        withCredentials: true
      });
      setSelectedItem(res.data);
    } catch (error) {
      console.error('Error fetching detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading,
  };
}

