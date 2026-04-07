import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from './useRedux'
import { fetchTranslations } from '@/redux/slices/languageSlice'
import type { AppDispatch } from '@/redux/store'

export const useRealtimeTranslations = () => {
  const dispatch = useDispatch<AppDispatch>()
  const currentLang = useAppSelector((state) => state.language.currentLang)
  const lastUpdated = useAppSelector((state) => state.language.lastUpdated)

  useEffect(() => {
    // Refresh translations when the language changes or when lastUpdated changes
    const refreshTranslations = async () => {
      await dispatch(fetchTranslations({ lang: currentLang, forceFetch: true }))
    }
    
    refreshTranslations()
  }, [currentLang, lastUpdated, dispatch])
}