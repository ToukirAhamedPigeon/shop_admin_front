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
      roles: [],
      isActive: 'true',
    }
  })

  // Watch values for the form
  const formValues = watch()

  useEffect(() => {
    // Only load once
    if (!hasLoaded.current && permissionId) {
      hasLoaded.current = true
      loadPermission()
    }
  }, [permissionId]) // Only depend on permissionId

  const loadPermission = async () => {
    try {
      setLoading(true)
      const permission: IPermission = await getPermissionForEdit(permissionId)
      console.log('Loaded permission data:', permission)
      
      // Prepare the form data
      const formData = {
        name: permission.name,
        guardName: permission.guardName,
        roles: permission.roles || [],
        isActive: permission.isActive ? 'true' : 'false',
      }
      
      console.log('Setting form values:', formData)
      
      // Reset form with new values
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
      console.log('Submitting permission data:', data)
      
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {t('Edit Permission Information')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('Update permission details and assigned roles')}
            </span>
          </div>

          <BasicInput
            id="name"
            label="Permission Name"
            isRequired
            placeholder="Permission name"
            register={register('name')}
            error={errors.name}
            model="Permission"
          />

          <BasicInput
            id="guardName"
            label="Guard Name"
            isRequired
            placeholder="Guard name (e.g., admin)"
            register={register('guardName')}
            error={errors.guardName}
            model="Permission"
          />

          <CustomSelect<FormData>
            id="roles"
            label="Roles"
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
            model="Permission"
          />
        </div>

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="bg-amber-600 text-white shadow hover:bg-amber-700" disabled={submitLoading}>
            {submitLoading ? t('Updating') + '...' : t('Update Permission')}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}