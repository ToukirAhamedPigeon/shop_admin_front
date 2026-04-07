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

      // Refresh the translations table
      await fetchData()
      
      // Refresh the frontend translations cache for real-time UI update
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {t('Add New Translation')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('Enter key, module, and values for English and Bangla')}
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
          <Button type="submit" className="btn-success-gradient" disabled={submitLoading}>
            {submitLoading ? t('Creating') + '...' : t('Create Translation')}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}