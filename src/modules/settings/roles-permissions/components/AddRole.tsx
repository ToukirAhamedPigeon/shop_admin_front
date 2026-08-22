// src/modules/roles/components/AddRole.tsx
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
import { Shield, Lock, Key, ShieldCheck, PlusCircle } from 'lucide-react'

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
                  {t('Add New Role')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('You can add multiple roles by separating names with "="')} (
                  <span className="text-destructive font-semibold">=</span>
                  ) {t('(e.g., "Admin=Editor=Viewer")')}
                </p>
              </div>
            </div>

            {/* Role Names */}
            <div className="grid grid-cols-1 gap-5">
              <BasicInput
                id="names"
                label="Role Names"
                isRequired
                placeholder="Enter role names separated by '=' (e.g., Admin=Editor=Viewer)"
                register={register('names')}
                error={errors.names}
                model="Role"
              />
            </div>

            {/* Guard Name */}
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('Security Settings')}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <BasicInput
                id="guardName"
                label="Guard Name"
                isRequired
                placeholder="Guard name (e.g., admin, web, api)"
                register={register('guardName')}
                error={errors.guardName}
                model="Role"
              />
            </div>

            {/* Permissions Section */}
            <div className="flex items-center gap-3 mb-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('Permissions Assignment')}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
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
            </div>

            {/* Status Section */}
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('Role Status')}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    {t('Create Role(s)')}
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
