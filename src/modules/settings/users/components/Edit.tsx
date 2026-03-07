import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getUserForEditById, updateUser } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import {
  BasicInput,
  BasicTextarea,
  CustomSelect,
  SingleImageInput,
  UniqueInput
} from "@/components/custom/FormInputs"
import { BOOLEAN_OPTIONS } from "@/constants"
import { useProfilePicture } from "@/hooks/useProfilePicture"
import { useTranslations } from "@/hooks/useTranslations"
import z from "zod"

interface Props {
  userId: string
  fetchData: () => Promise<void>
  onClose: () => void
}

export const editSchema = z.object({
   // Name: required
    name: z.string().min(1, 'Name is required'),
  
    // Username: required, min 4 chars
    username: z
      .string()
      .min(4, 'Username must be at least 4 characters'),
  
    // Email: required and valid
    email: z.string().email({ message: "Invalid email" }),
    // Mobile: optional but min 11 digits if provided
    mobile_no: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 11, {
        message: "Mobile Number must be at least 11 digits",
      }),
  
    // NID: optional, but uniqueness handled via API
    nid: z.string().optional(),
    // Optional fields
    address: z.string().optional(),
    is_active: z.string().optional(),
    roles: z.array(z.string())
      .min(1, 'At least one role must be selected'),
  
    // Permissions: optional array
    permissions: z.array(z.string()).optional(),
    profile_image: z.union([
      z.instanceof(File),
      z.string(),
      z.undefined()
    ]).optional(),
})

export type EditUserFormValues = z.infer<typeof editSchema>

export default function Edit({ userId, fetchData, onClose }: Props) {
  const { t } = useTranslations()
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const model = "User"

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors }
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      name: "",
      username: "",
      email: "",
      profile_image: undefined,
      mobile_no: "",
      address: "",
      nid: "",
      is_active: "true",
      roles: [],
      permissions: []
    }
  })

  // ------------------------------
  // Profile Picture Hook
  // ------------------------------
  const { preview, clearImage, onDrop } = useProfilePicture(
    setValue,
    setError,
    "profile_image",
    watch("profile_image") ?? undefined
  )

  // ------------------------------
  // Fetch User Data ONCE
  // ------------------------------
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getUserForEditById(userId)
        const user = res.data
        // Reset form only once with fetched data
        reset({
          name: user.name ?? "",
          username: user.username ?? "",
          email: user.email ?? "",
          mobile_no: user.mobileNo ?? "",
          nid: user.nid ?? "",
          address: user.address ?? "",
          is_active: user.isActive ? "true" : "false",
          roles: user.roles || [],
          permissions: user.permissions || [],
          profile_image: user.profileImage ?? undefined
        })

        if (user.profileImage) {
          setValue("profile_image", import.meta.env.VITE_API_BASE_URL + user.profileImage, { shouldValidate: false })
        }
      } catch(e) {
        console.log(e)
        dispatchShowToast({ type: "danger", message: t("Failed to load user") })
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // ------------------------------
  // Sync profile image when its value changes
  // ------------------------------
  const profileImg = watch("profile_image")
  const prevProfileImgRef = useRef(profileImg)

  useEffect(() => {
    // Only clear if we're explicitly setting to undefined/null AND it's not the initial load
    if (!profileImg && prevProfileImgRef.current && !loading) {
      clearImage()
    }
    prevProfileImgRef.current = profileImg
  }, [profileImg, loading])

  // ------------------------------
  // Form Submit
  // ------------------------------
  const onSubmit = async (data: EditUserFormValues) => {
    setSubmitLoading(true)
    try {
      const formData = new FormData()
    
      // Handle regular fields
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        
        // Skip profile_image - handle separately
        if (key === 'profile_image') return
        
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v))
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString())
        } else {
          formData.append(key, String(value))
        }
      })
      
      // Handle profile image with clear flags
      const currentProfileImage = watch("profile_image")
      
      if (currentProfileImage instanceof File) {
        // Case: New image uploaded
        formData.append("profile_image", currentProfileImage)
        formData.append("remove_profile_image", "false")
      } else if (!currentProfileImage && preview === null) {
        // Case: Image was removed (preview is null AND no file in form state)
        formData.append("remove_profile_image", "true")
      } else {
        // Case: Keep existing image
        formData.append("remove_profile_image", "false")
      }
    
      await updateUser(userId, formData)

      dispatchShowToast({ type: "success", message: t("User updated successfully") })

      await fetchData()
      onClose()
    } catch (err: any) {
      dispatchShowToast({
        type: "danger",
        message: err.response?.data || t("Update failed")
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = () => reset()

  if (loading) return <div>{t("Loading...")}</div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name + Username + Password */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full space-y-4 flex flex-col justify-end">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full space-y-4 flex flex-col">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t("Provide User Information")}</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {t("Fill all required fields")} (<span className="text-red-500">*</span>)
                </span>
              </div>
              
              <BasicInput
                id="name"
                label="Name"
                isRequired
                placeholder="Name"
                register={register("name", { required: "Name is required" })}
                error={errors.name}
                model={model}
              />
              <UniqueInput
                  id="username"
                  label={t("Username")}
                  placeholder="Username"
                  model={model}
                  isRequired
                  register={register("username")}
                  error={errors.username}
                  uniqueErrorMessage={t("Username already exists")}
                  field="Username"
                  exceptFieldName="Id"
                  exceptFieldValue={userId}
                  watchValue={watch("username")}
              />
              <UniqueInput
                  id="email"
                  label={t("Email")}
                  placeholder="Email"
                  model={model}
                  register={register("email")}
                  error={errors.email}
                  uniqueErrorMessage={t("Email already exists")}
                  field="Email"
                  isRequired
                  exceptFieldName="Id"
                  exceptFieldValue={userId}
                  watchValue={watch("email") || ""}
              />
            </div>
            <div className="w-full">
              {/* Profile Picture */}
                <SingleImageInput
                  label="Profile Picture"
                  preview={preview}
                  onDrop={onDrop}
                  clearImage={clearImage}
                  error={errors.profile_image}
                  className='sm:text-center text-left'
                  isRequired={false}
                  minHeightClass='h-[250px]'
                />
            </div>
          </div>
        </div>
      </div>

      {/* Name + Email */}
      <div className="flex flex-col md:flex-row gap-4">
        
      </div>

      {/* Mobile + Roles */}
      <div className="flex flex-col md:flex-row gap-4">
        <UniqueInput
          id="mobile_no"
          label={t("Mobile No")}
          field="MobileNo"
          isRequired
          placeholder="Mobile No"
          register={register("mobile_no")}
          uniqueErrorMessage={t("Mobile Number already exists")}
          error={errors.mobile_no}
          model={model}
          exceptFieldName="Id"
          exceptFieldValue={userId}
          watchValue={watch("mobile_no") || ""}
        />

        <CustomSelect<EditUserFormValues>
          id="roles"
          label={t("Roles")}
          name="roles"
          setValue={setValue}
          model="User"
          apiUrl="/Options/roles"
          collection="Role"
          labelFields={["name"]}
          valueFields={["name"]}
          sortOrder="asc"
          isRequired
          placeholder={t("Select Roles")}
          multiple
          value={watch("roles")}
          error={errors.roles && ("message" in errors.roles ? errors.roles : undefined)}
        />
      </div>

      {/* Permissions */}
      <CustomSelect<EditUserFormValues>
        id="permissions"
        label={t("Permissions")}
        name="permissions"
        setValue={setValue}
        model="User"
        apiUrl="/Options/permissions"
        collection="Permission"
        labelFields={["name"]}
        valueFields={["name"]}
        sortOrder="asc"
        isRequired={false}
        placeholder={t("Select Permissions")}
        multiple
        value={watch("permissions")}
        error={errors.permissions?.[0]}
      />

      {/* Status + Gender */}
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<EditUserFormValues>
          id="is_active"
          label={t("Is Active?")}
          name="is_active"
          placeholder={t("Select Current Status")}
          isRequired
          options={BOOLEAN_OPTIONS}
          error={errors.is_active}
          setValue={setValue}
          value={watch("is_active")}
          model={model}
        />
        <UniqueInput
          id="nid"
          label={t("NID")}
          placeholder="NID"
          model={model}
          isRequired={false}
          register={register("nid")}
          error={errors.nid}
          uniqueErrorMessage={t("NID already exists")}
          field="NID"
          exceptFieldName="Id"
          exceptFieldValue={userId}
          watchValue={watch("nid") || ""}
        />
      </div>

      {/* Address + Bio */}
      <div className="flex flex-col md:flex-row gap-4">
        <BasicTextarea
          id="address"
          label={t("Address")}
          placeholder={t("Enter address")}
          register={register("address")}
          error={errors.address}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
        <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
          {t("Reset Form")}
        </Button>

        <Button type="submit" className="bg-amber-600 text-white shadow hover:bg-amber-700" disabled={submitLoading}>
          {submitLoading ? t("Updating") + "..." : t("Update User")}
        </Button>
      </div>
    </form>
  )
}
