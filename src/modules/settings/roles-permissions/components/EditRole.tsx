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
  const hasLoaded = useRef(false) // Track if data has been loaded

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

  // Watch values for the form
  const formValues = watch()

  useEffect(() => {
    // Only load once
    if (!hasLoaded.current && roleId) {
      hasLoaded.current = true
      loadRole()
    }
  }, [roleId]) // Only depend on roleId

  const loadRole = async () => {
    try {
      setLoading(true)
      const role: IRole = await getRoleForEdit(roleId)
      console.log('Loaded role data:', role)
      
      // Prepare the form data
      const formData = {
        name: role.name,
        guardName: role.guardName,
        permissions: role.permissions || [],
        isActive: role.isActive ? 'true' : 'false',
      }
      
      console.log('Setting form values:', formData)
      
      // Reset form with new values
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
      console.log('Submitting role data:', data)
      
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {t('Edit Role Information')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('Update role details and permissions')}
            </span>
          </div>

          <BasicInput
            id="name"
            label="Role Name"
            isRequired
            placeholder="Role name"
            register={register('name')}
            error={errors.name}
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
            value={formValues.permissions || []}
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
            value={formValues.isActive || 'true'}
            model="Role"
          />
        </div>

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="bg-amber-600 text-white shadow hover:bg-amber-700" disabled={submitLoading}>
            {submitLoading ? t('Updating') + '...' : t('Update Role')}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}