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
import { useAppSelector } from '@/hooks/useRedux'

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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'

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
      <div
        className="relative rounded-2xl backdrop-blur-xl transition-all duration-300 p-6 mb-6"
        style={{
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.4)'
            : 'rgba(255, 255, 255, 0.55)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {/* Animated gradient border overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(100,120,255,0.08), rgba(180,100,255,0.05))',
          }}
        />
        
        {/* Colored accent line at top */}
        <div
          className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#6366f1' : '#818cf8'}, ${isDarkMode ? '#a855f7' : '#c084fc'}, transparent)`,
          }}
        />

        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  {t('Add New Role')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('You can add multiple roles by separating names with "="')} (
                  <span className="text-red-500 font-semibold">=</span>
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
              <Lock className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              <Key className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset} 
                disabled={submitLoading}
                className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                {t('Reset Form')}
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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