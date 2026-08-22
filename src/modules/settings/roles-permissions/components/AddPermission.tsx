// src/modules/permissions/components/AddPermission.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs'
import { useTranslations } from '@/hooks/useTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import { createPermission } from '../api'
import { Shield, Lock, Users, Activity, PlusCircle } from 'lucide-react'

const schema = z.object({
  names: z.string().min(1, 'Permission name(s) are required'),
  guardName: z.string().min(1, 'Guard name is required'),
  roles: z.array(z.string()).optional(),
  isActive: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddPermissionProps {
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function AddPermission({ fetchData, onClose }: AddPermissionProps) {
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
      roles: [],
      isActive: 'true',
    }
  })

  const selectedRoles = watch('roles')
  const selectedIsActive = watch('isActive')

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)
    try {
      await createPermission({
        names: data.names,
        guardName: data.guardName,
        roles: data.roles || [],
        isActive: data.isActive
      })

      dispatchShowToast({
        type: 'success',
        message: t('Permission(s) created successfully')
      })

      reset()
      await fetchData()
      onClose()
    } catch (error: any) {
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to create permission(s)')
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = () => {
    reset({
      names: '',
      guardName: 'admin',
      roles: [],
      isActive: 'true',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="rounded-xl bg-card border border-border shadow-sm p-6 mb-6">
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Add New Permission')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('You can add multiple permissions by separating names with "="')}
                </p>
              </div>
            </div>

            {/* Permission Names */}
            <div>
              <BasicInput
                id="names"
                label="Permission Names"
                isRequired
                placeholder="e.g., create-user=edit-user=delete-user"
                register={register('names')}
                error={errors.names}
                model="Permission"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('Example')}: create-user=edit-user=delete-user
              </p>
            </div>

            {/* Guard Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  {t('Security Settings')}
                </label>
              </div>
              <BasicInput
                id="guardName"
                label="Guard Name"
                isRequired
                placeholder="Guard name (e.g., admin)"
                register={register('guardName')}
                error={errors.guardName}
                model="Permission"
              />
            </div>

            {/* Roles */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  {t('Role Assignment')}
                </label>
              </div>
              <CustomSelect<FormData>
                id="roles"
                label=""  // Empty label to hide the built-in label
                name="roles"
                setValue={setValue}
                model="Permission"
                apiUrl="/Options/roles"
                collection="Role"
                labelFields={['name']}
                valueFields={['name']}
                sortOrder="asc"
                isRequired={false}
                placeholder="Select Roles"
                multiple
                value={selectedRoles}
                error={errors.roles?.[0]}
              />
            </div>

            {/* Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  {t('Status')} <span className="text-destructive">*</span>
                </label>
              </div>
              <CustomSelect<FormData>
                id="isActive"
                label=""  // Empty label to hide the built-in label
                name="isActive"
                placeholder="Select Current Status"
                isRequired={false}  // We handle the required indicator manually
                options={[
                  { label: 'Active', value: 'true' },
                  { label: 'Inactive', value: 'false' }
                ]}
                error={errors.isActive}
                setValue={setValue}
                value={selectedIsActive}
                model="Permission"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitLoading}
              >
                {t('Reset Form')}
              </Button>
              <Button
                type="submit"
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
                    {t('Create Permission(s)')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
