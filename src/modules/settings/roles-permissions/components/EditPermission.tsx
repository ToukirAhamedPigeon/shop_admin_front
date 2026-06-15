// src/modules/role-permission/components/EditPermission.tsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs'
import { useTranslations } from '@/hooks/useTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import Loader from '@/components/custom/Loader'
import { getPermissionForEdit, updatePermission } from '../api'
import type { IPermission } from '@/types/role-permission'
import { useRefreshAuth } from '@/hooks/useRefreshAuth';
import { useAppSelector } from '@/hooks/useRedux';
import { Edit3, Shield, AlertTriangle, Key, Users } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Permission name is required'),
  guardName: z.string().min(1, 'Guard name is required'),
  roles: z.array(z.string()).optional(),
  isActive: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface EditPermissionProps {
  permissionId: string
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function EditPermission({ permissionId, fetchData, onClose }: EditPermissionProps) {
  const { t } = useTranslations()
  const { refreshUser } = useRefreshAuth()
  const currentUser = useAppSelector((state) => state.auth.user)
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const hasLoaded = useRef(false)

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
      name: '',
      guardName: 'admin',
      roles: [],
      isActive: 'true',
    }
  })

  const formValues = watch()

  useEffect(() => {
    if (!hasLoaded.current && permissionId) {
      hasLoaded.current = true
      loadPermission()
    }
  }, [permissionId])

  const loadPermission = async () => {
    try {
      setLoading(true)
      const permission: IPermission = await getPermissionForEdit(permissionId)
      
      const formData = {
        name: permission.name,
        guardName: permission.guardName,
        roles: permission.roles || [],
        isActive: permission.isActive ? 'true' : 'false',
      }
      
      reset(formData)
    } catch (error) {
      console.error('Failed to load permission:', error)
      dispatchShowToast({
        type: 'danger',
        message: t('Failed to load permission data')
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)
    try {
      await updatePermission(permissionId, {
        name: data.name,
        guardName: data.guardName,
        roles: data.roles || [],
        isActive: data.isActive
      })

      const currentUserPermissions = currentUser?.permissions || []
      const permissionName = data.name
      
      if (currentUserPermissions.includes(permissionName)) {
        await refreshUser()
      }

      dispatchShowToast({
        type: 'success',
        message: t('Permission updated successfully')
      })

      await fetchData()
      onClose()
    } catch (error: any) {
      console.error('Update error:', error)
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to update permission')
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setLoading(true)
      const permission: IPermission = await getPermissionForEdit(permissionId)
      const formData = {
        name: permission.name,
        guardName: permission.guardName,
        roles: permission.roles || [],
        isActive: permission.isActive ? 'true' : 'false',
      }
      reset(formData)
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
        
        {/* Colored accent line at top - Indigo/Purple theme */}
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                <Edit3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {t('Edit Permission')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('Update permission details and assigned roles')}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>{t('Edit Mode')}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('Note: Changes to permission name or guard name may affect role assignments')}
              </p>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-5">
              <BasicInput
                id="name"
                label="Permission Name"
                isRequired
                placeholder="e.g., create-users, edit-roles"
                register={register('name')}
                error={errors.name}
                model="Permission"
              />

              <BasicInput
                id="guardName"
                label="Guard Name"
                isRequired
                placeholder="Guard name (e.g., admin, web, api)"
                register={register('guardName')}
                error={errors.guardName}
                model="Permission"
              />

              <CustomSelect<FormData>
                id="roles"
                label="Assigned Roles"
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
                value={formValues.roles || []}
                error={errors.roles?.[0]}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomSelect<FormData>
                  id="isActive"
                  label="Status"
                  name="isActive"
                  placeholder="Select Current Status"
                  isRequired
                  options={[
                    { label: 'Active', value: 'true' },
                    { label: 'Inactive', value: 'false' }
                  ]}
                  error={errors.isActive}
                  setValue={setValue}
                  value={formValues.isActive || 'true'}
                  model="Permission"
                />
                
                {/* Empty div for layout balance */}
                <div />
              </div>
            </div>

            {/* Role Assignment Note */}
            {formValues.roles && formValues.roles.length > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-green-50/50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {t('This permission is currently assigned to')} <span className="font-semibold">{formValues.roles.length}</span> {t('role(s)')}
                  </p>
                </div>
              </div>
            )}

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
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
                    {t('Update Permission')}
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