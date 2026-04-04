import { useDispatch } from 'react-redux';
import { refreshUserProfile } from '@/redux/slices/authSlice';
import { type AppDispatch } from '@/redux/store';

export const useRefreshAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  const refreshUser = async () => {
    try {
      await dispatch(refreshUserProfile()).unwrap();
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return { refreshUser };
};