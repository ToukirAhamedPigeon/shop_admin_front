// src/modules/settings/translations/components/AddTranslation.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BasicInput } from '@/components/custom/FormInputs'
import { useTranslations } from '@/hooks/useTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import { createTranslation } from '../api'
import { useRefreshTranslations } from '@/hooks/useRefreshTranslations'
import TranslationGlassCard from './TranslationGlassCard'
import { PlusCircle, Languages } from 'lucide-react'

const schema = z.object({
  key: z.string().min(1, 'Key is required'),
  module: z.string().min(1, 'Module is required'),
  englishValue: z.string().min(1, 'English value is required'),
  banglaValue: z.string().min(1, 'Bangla value is required'),
})

type FormData = z.infer<typeof schema>

interface AddTranslationProps {
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function AddTranslation({ fetchData, onClose }: AddTranslationProps) {
  const { t } = useTranslations()
  const { refreshTranslations } = useRefreshTranslations()
  const [submitLoading, setSubmitLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: '',
      module: 'common',
      englishValue: '',
      banglaValue: '',
    }
  })

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)
    try {
      await createTranslation({
        key: data.key,
        module: data.module,
        englishValue: data.englishValue,
        banglaValue: data.banglaValue
      })

      dispatchShowToast({
        type: 'success',
        message: t('Translation created successfully')
      })

      await fetchData()
      await refreshTranslations()
      
      reset()
      onClose()
    } catch (error: any) {
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to create translation')
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = () => {
    reset({
      key: '',
      module: 'common',
      englishValue: '',
      banglaValue: '',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <TranslationGlassCard variant="primary" padding="lg" className="mb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
              <Languages className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {t('Add New Translation')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('Enter key, module, and values for English and Bangla')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BasicInput
              id="key"
              label="Translation Key"
              isRequired
              placeholder="e.g., welcome.message"
              register={register('key')}
              error={errors.key}
              model="Translation"
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('Creating')}...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t('Create Translation')}
                </>
              )}
            </Button>
          </div>
        </form>
      </TranslationGlassCard>
    </motion.div>
  )
}