import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs'
import { useTranslations } from '@/hooks/useTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import { createRole } from '../api'

const schema = z.object({
  names: z.string().min(1, 'Role name(s) are required'),
  guardName: z.string().min(1, 'Guard name is required'),
  permissions: z.array(z.string()).optional(),
  isActive: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddRoleProps {
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function AddRole({ fetchData, onClose }: AddRoleProps) {
  const { t } = useTranslations()
  const [submitLoading, setSubmitLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      names: '',
      guardName: 'admin',
      permissions: [],
      isActive: 'true',
    }
  })

  // Watch values for debugging
  const selectedPermissions = watch('permissions')
  const selectedIsActive = watch('isActive')

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)
    try {
      await createRole({
        names: data.names,
        guardName: data.guardName,
        permissions: data.permissions || [],
        isActive: data.isActive
      })

      dispatchShowToast({
        type: 'success',
        message: t('Role(s) created successfully')
      })

      reset()
      await fetchData()
      onClose()
    } catch (error: any) {
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to create role(s)')
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = () => {
    reset({
      names: '',
      guardName: 'admin',
      permissions: [],
      isActive: 'true',
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
              {t('Provide Role Information')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('You can add multiple roles by separating names with "=" (e.g., "Admin=Editor=Viewer")')}
            </span>
          </div>

          <BasicInput
            id="names"
            label="Role Names"
            isRequired
            placeholder="Enter role names separated by '='"
            register={register('names')}
            error={errors.names}
            model="Role"
          />

          <BasicInput
            id="guardName"
            label="Guard Name"
            isRequired
            placeholder="Guard name (e.g., admin)"
            register={register('guardName')}
            error={errors.guardName}
            model="Role"
          />

          <CustomSelect<FormData>
            id="permissions"
            label="Permissions"
            name="permissions"
            setValue={setValue}
            model="Role"
            apiUrl="/Options/permissions"
            collection="Permission"
            labelFields={['name']}
            valueFields={['name']}
            sortOrder="asc"
            isRequired={false}
            placeholder="Select Permissions"
            multiple
            value={selectedPermissions}
            error={errors.permissions?.[0]}
          />

          <CustomSelect<FormData>
            id="isActive"
            label="Is Active?"
            name="isActive"
            placeholder="Select Current Status"
            isRequired
            options={[
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' }
            ]}
            error={errors.isActive}
            setValue={setValue}
            value={selectedIsActive}
            model="Role"
          />
        </div>

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="btn-success-gradient" disabled={submitLoading}>
            {submitLoading ? t('Creating') + '...' : t('Create Role(s)')}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}