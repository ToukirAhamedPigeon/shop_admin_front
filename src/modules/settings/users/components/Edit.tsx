import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { schema } from "./Add"
import type { UserFormValues } from "@/types"
import { getUserById, updateUser } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import DateTimeInput, {
  BasicInput,
  BasicTextarea,
  CustomSelect,
  PasswordInput,
  SingleImageInput,
  UniqueInput
} from "@/components/custom/FormInputs"
import { BOOLEAN_OPTIONS, GENDER_OPTIONS } from "@/constants"
import { useProfilePicture } from "@/hooks/useProfilePicture"
import { useTranslations } from "@/hooks/useTranslations"

interface Props {
  userId: string
  fetchData: () => Promise<void>
  onClose: () => void
}

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
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmed_password: "",
      profile_image: undefined,
      mobile_no: "",
      address: "",
      nid: "",
      dob: null,
      bio: "",
      is_active: "true",
      gender: "male",
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
        const res = await getUserById(userId)
        const user = res.data

        // Reset form only once with fetched data
        reset({
          name: user.name ?? "",
          username: user.username ?? "",
          email: user.email ?? "",
          mobile_no: user.mobileNo ?? "",
          nid: user.nid ?? "",
          address: user.address ?? "",
          bio: user.bio ?? "",
          gender: user.gender ?? "male",
          dob: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
          is_active: user.isActive ? "true" : "false",
          roles: user.roles || [],
          permissions: user.permissions || [],
          password: "",
          confirmed_password: "",
          profile_image: user.profileImage ?? undefined
        })

        if (user.profileImage) onDrop([user.profileImage as any], user.profileImage as any)
        else clearImage()
      } catch {
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
  useEffect(() => {
    const profileImg = watch("profile_image")
    if (profileImg) onDrop([profileImg as any], profileImg as any)
    else clearImage()
  }, [watch("profile_image")])

  // ------------------------------
  // Form Submit
  // ------------------------------
  const onSubmit = async (data: UserFormValues) => {
    setSubmitLoading(true)
    try {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v))
        } else if (value instanceof File) {
          formData.append(key, value)
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString())
        } else {
          formData.append(key, String(value))
        }
      })

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
          <div className="flex flex-col justify-end">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t("Provide User Information")}</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t("Fill all required fields")} (<span className="text-red-500">*</span>)
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
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

        <CustomSelect<UserFormValues>
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
      <CustomSelect<UserFormValues>
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
        <CustomSelect<UserFormValues>
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
