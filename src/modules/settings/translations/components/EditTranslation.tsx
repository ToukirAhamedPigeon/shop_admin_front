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

      // Refresh the translations table
      await fetchData()
      
      // Force refresh the frontend translations cache
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {t('Edit Translation')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('Update translation key, module, and values')}
              {!isDeveloper && (
                <span className="block text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ {t('Only Developer users can edit the Key field')}
                </span>
              )}
            </span>
          </div>

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

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="bg-amber-600 text-white shadow hover:bg-amber-700" disabled={submitLoading}>
            {submitLoading ? t('Updating') + '...' : t('Update Translation')}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}