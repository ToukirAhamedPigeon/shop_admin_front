// src/modules/role-permission/components/EditRole.tsx
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
import { getRoleForEdit, updateRole } from '../api'
import type { IRole } from '@/types/role-permission'
import { useRefreshAuth } from '@/hooks/useRefreshAuth';
import { useAppSelector } from '@/hooks/useRedux';
import { Edit3, Shield, AlertTriangle, Lock } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Role name is required'),
  guardName: z.string().min(1, 'Guard name is required'),
  permissions: z.array(z.string()).optional(),
  isActive: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface EditRoleProps {
  roleId: string
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function EditRole({ roleId, fetchData, onClose }: EditRoleProps) {
  const { t } = useTranslations()
  const { refreshUser } = useRefreshAuth()
  const currentUser = useAppSelector((state) => state.auth.user)
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
      permissions: [],
      isActive: 'true',
    }
  })

  const formValues = watch()

  useEffect(() => {
    if (!hasLoaded.current && roleId) {
      hasLoaded.current = true
      loadRole()
    }
  }, [roleId])

  const loadRole = async () => {
    try {
      setLoading(true)
      const role: IRole = await getRoleForEdit(roleId)

      const formData = {
        name: role.name,
        guardName: role.guardName,
        permissions: role.permissions || [],
        isActive: role.isActive ? 'true' : 'false',
      }

      reset(formData)
    } catch (error) {
      console.error('Failed to load role:', error)
      dispatchShowToast({
        type: 'danger',
        message: t('Failed to load role data')
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)
    try {
      await updateRole(roleId, {
        name: data.name,
        guardName: data.guardName,
        permissions: data.permissions || [],
        isActive: data.isActive
      })

      const currentUserRoles = currentUser?.roles || []
      const roleName = data.name

      if (currentUserRoles.includes(roleName)) {
        await refreshUser()
      }

      dispatchShowToast({
        type: 'success',
        message: t('Role updated successfully')
      })

      await fetchData()
      onClose()
    } catch (error: any) {
      console.error('Update error:', error)
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to update role')
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setLoading(true)
      const role: IRole = await getRoleForEdit(roleId)
      const formData = {
        name: role.name,
        guardName: role.guardName,
        permissions: role.permissions || [],
        isActive: role.isActive ? 'true' : 'false',
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
      <div className="rounded-xl bg-card border border-border shadow-sm p-6 mb-6">
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="p-2 rounded-lg bg-primary/10">
                <Edit3 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  {t('Edit Role')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('Update role details and assigned permissions')}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs">
                <Shield className="w-3 h-3" />
                <span>{t('Edit Mode')}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {t('Note: Changes to role permissions will affect all users assigned to this role')}
              </p>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <BasicInput
                  id="name"
                  label="Role Name"
                  isRequired
                  placeholder="e.g., Super Admin, Editor, Viewer"
                  register={register('name')}
                  error={errors.name}
                  model="Role"
                />

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

              <CustomSelect<FormData>
                id="permissions"
                label="Assigned Permissions"
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
                value={formValues.permissions || []}
                error={errors.permissions?.[0]}
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
                  model="Role"
                />

                {/* Empty div for layout balance */}
                <div />
              </div>
            </div>

            {/* Permission Assignment Note */}
            {formValues.permissions && formValues.permissions.length > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-muted border border-border">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {t('This role has')} <span className="font-semibold text-foreground">{formValues.permissions.length}</span> {t('permission(s) assigned')}
                  </p>
                </div>
              </div>
            )}

            {/* Role Name Warning - if editing important role */}
            {formValues.name && (formValues.name.toLowerCase().includes('admin') || formValues.name.toLowerCase().includes('super')) && (
              <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t('This is a privileged role. Changes may impact security settings.')}
                  </p>
                </div>
              </div>
            )}

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
                    {t('Updating')}...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('Update Role')}
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
