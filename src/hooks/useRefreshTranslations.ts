import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from './useRedux';
import { fetchTranslations } from '@/redux/slices/languageSlice';
import { type AppDispatch } from '@/redux/store';

export const useRefreshTranslations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentLang = useAppSelector((state) => state.language.currentLang);

  const refreshTranslations = useCallback(async () => {
    await dispatch(fetchTranslations({ lang: currentLang, forceFetch: true }));
  }, [dispatch, currentLang]);

  return { refreshTranslations };
};