// src/modules/settings/translations/components/EditTranslation.tsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { Button } from '@/components/ui/button'
import { BasicInput } from '@/components/custom/FormInputs'
import { useTranslations } from '@/hooks/useTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import Loader from '@/components/custom/Loader'
import { getTranslationForEdit, updateTranslation } from '../api'
import { useAppSelector } from '@/hooks/useRedux'
import { fetchTranslations } from '@/redux/slices/languageSlice'
import { type AppDispatch } from '@/redux/store'
import type { ITranslation } from '@/types/translation'
import { useRefreshTranslations } from '@/hooks/useRefreshTranslations'
import TranslationGlassCard from './TranslationGlassCard'
import { Edit3, Shield, AlertTriangle } from 'lucide-react'

const schema = z.object({
  key: z.string().min(1, 'Key is required'),
  module: z.string().min(1, 'Module is required'),
  englishValue: z.string().min(1, 'English value is required'),
  banglaValue: z.string().min(1, 'Bangla value is required'),
})

type FormData = z.infer<typeof schema>

interface EditTranslationProps {
  translationId: string
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function EditTranslation({ translationId, fetchData, onClose }: EditTranslationProps) {
  const { t, currentLang } = useTranslations()
  const dispatch = useDispatch<AppDispatch>()
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const hasLoaded = useRef(false)
  const currentUser = useAppSelector((state) => state.auth.user)
  const { refreshTranslations } = useRefreshTranslations()
  
  const isDeveloper = currentUser?.roles?.includes('developer') ?? false

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: '',
      module: '',
      englishValue: '',
      banglaValue: '',
    }
  })

  useEffect(() => {
    if (!hasLoaded.current && translationId) {
      hasLoaded.current = true
      loadTranslation()
    }
  }, [translationId])

  const loadTranslation = async () => {
    try {
      setLoading(true)
      const translation: ITranslation = await getTranslationForEdit(translationId)
      
      reset({
        key: translation.key,
        module: translation.module,
        englishValue: translation.englishValue,
        banglaValue: translation.banglaValue,
      })
    } catch (error) {
      console.error('Failed to load translation:', error)
      dispatchShowToast({
        type: 'danger',
        message: t('Failed to load translation data')
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)
    try {
      await updateTranslation(Number(translationId), {
        key: data.key,
        module: data.module,
        englishValue: data.englishValue,
        banglaValue: data.banglaValue
      })
      await refreshTranslations()

      dispatchShowToast({
        type: 'success',
        message: t('Translation updated successfully')
      })

      await fetchData()
      await dispatch(fetchTranslations({ lang: currentLang, forceFetch: true }))
      
      onClose()
    } catch (error: any) {
      console.error('Update error:', error)
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to update translation')
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setLoading(true)
      const translation: ITranslation = await getTranslationForEdit(translationId)
      reset({
        key: translation.key,
        module: translation.module,
        englishValue: translation.englishValue,
        banglaValue: translation.banglaValue,
      })
    } catch (error) {
      console.error('Failed to reset form:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader type="circular" size={48} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <TranslationGlassCard variant="warning" padding="lg" className="mb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <Edit3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                {t('Edit Translation')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('Update translation key, module, and values')}
              </p>
            </div>
            {!isDeveloper && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>Read-only: Key field</span>
              </div>
            )}
          </div>

          {!isDeveloper && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('Only Developer users can edit the Key field')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BasicInput
              id="key"
              label="Translation Key"
              isRequired
              placeholder="e.g., welcome.message"
              register={register('key')}
              error={errors.key}
              model="Translation"
              readOnly={!isDeveloper}
              className={!isDeveloper ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""}
            />

            <BasicInput
              id="module"
              label="Module"
              isRequired
              placeholder="e.g., common"
              register={register('module')}
              error={errors.module}
              model="Translation"
            />

            <BasicInput
              id="englishValue"
              label="English Value"
              isRequired
              placeholder="Value in English"
              register={register('englishValue')}
              error={errors.englishValue}
              model="Translation"
            />

            <BasicInput
              id="banglaValue"
              label="Bangla Value"
              isRequired
              placeholder="Value in Bangla"
              register={register('banglaValue')}
              error={errors.banglaValue}
              model="Translation"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
              {t('Reset Form')}
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('Updating')}...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  {t('Update Translation')}
                </>
              )}
            </Button>
          </div>
        </form>
      </TranslationGlassCard>
    </motion.div>
  )
}