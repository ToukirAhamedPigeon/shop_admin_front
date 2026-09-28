// src/modules/settings/users/components/UserForm.tsx
// Add and Edit share this form. Add also sets the password and the personal
// extras (gender, date of birth, bio); Edit sends only the fields its API takes.
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { KeyRound, Loader2, NotebookPen, RotateCcw, ShieldCheck, UserPlus, UserRound, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import DateTimeInput, { BasicInput, BasicTextarea, CustomSelect, PasswordInput, UniqueInput } from "@/components/custom/FormInputs"
import { AvatarPicker, FieldGrid, FormSection, FormSkeleton, SheetFooter, SwitchField } from "@/components/custom/FormKit"
import PasswordStrength from "@/components/custom/PasswordStrength"
import { GENDER_OPTIONS } from "@/constants"
import { useProfilePicture } from "@/hooks/useProfilePicture"
import { useTranslations } from "@/hooks/useTranslations"
import { useRefreshAuth } from "@/hooks/useRefreshAuth"
import { useAppSelector } from "@/hooks/useRedux"
import { checkValueExists } from "@/lib/validations"
import { dispatchShowToast } from "@/lib/dispatch"
import { passwordSchema } from "@/lib/passwordRules"
import { assetUrl } from "@/lib/assetUrl"
import { createUsers, getUserForEditById, updateUser } from "../api"

const MODEL = "User"

const common = {
  name: z.string().min(1, "Name is required"),
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email({ message: "Invalid email" }),
  mobile_no: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 11, { message: "Mobile Number must be at least 11 digits" }),
  nid: z.string().optional(),
  address: z.string().optional(),
  is_active: z.string().optional(),
  roles: z.array(z.string()).min(1, "At least one role must be selected"),
  permissions: z.array(z.string()).optional(),
}

const addSchema = z
  .object({
    ...common,
    password: passwordSchema,
    confirmed_password: z.string().min(1, "Please confirm the password"),
    profile_image: z
      .instanceof(File)
      .optional()
      .refine((file) => !file || ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"].includes(file.type), {
        message: "Profile image must be an image",
      })
      .refine((file) => !file || file.size <= 5 * 1024 * 1024, { message: "Profile image must be less than 5MB" }),
    bio: z.string().optional(),
    dob: z.date().optional().nullable(),
    gender: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmed_password, {
    path: ["confirmed_password"],
    message: "Passwords don't match",
  })

const editSchema = z.object({
  ...common,
  profile_image: z.union([z.instanceof(File), z.string(), z.undefined()]).optional(),
})

/** Every field either mode uses; Edit leaves the Add-only ones empty. */
export type UserFormValues = {
  name: string
  username: string
  email: string
  password?: string
  confirmed_password?: string
  mobile_no?: string
  nid?: string
  profile_image?: File | string
  address?: string
  bio?: string
  dob?: Date | null
  gender?: string
  is_active?: string
  roles: string[]
  permissions?: string[]
}

const EMPTY: UserFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmed_password: "",
  mobile_no: "",
  nid: "",
  profile_image: undefined,
  address: "",
  bio: "",
  dob: undefined,
  gender: "male",
  is_active: "true",
  roles: [],
  permissions: [],
}

type Props =
  | { mode: "add"; fetchData: () => Promise<void>; onClose?: () => void }
  | { mode: "edit"; userId: string; fetchData: () => Promise<void>; onClose: () => void }

export default function UserForm(props: Props) {
  const { mode, fetchData } = props
  const userId = mode === "edit" ? props.userId : undefined
  const isEdit = mode === "edit"
  const { t } = useTranslations()
  const { refreshUser } = useRefreshAuth()
  const currentUserId = useAppSelector((s) => s.auth.user?.id)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  // Edit: what the form was loaded with, for "Reset" and to spot a changed photo.
  const loadedRef = useRef<UserFormValues>(EMPTY)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? editSchema : addSchema) as unknown as Resolver<UserFormValues>,
    defaultValues: EMPTY,
    mode: "onTouched",
  })
  const { register, handleSubmit, setValue, setError, reset, control, formState } = form
  const { errors, isDirty } = formState
  const values = useWatch({ control }) as UserFormValues

  const { preview, clearImage, onDrop } = useProfilePicture(setValue, setError, "profile_image", values.profile_image ?? undefined)

  // Edit: load the user once.
  const loadedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!userId || loadedFor.current === userId) return
    loadedFor.current = userId
    setLoading(true)
    getUserForEditById(userId)
      .then((res) => {
        const u = res.data
        const loaded: UserFormValues = {
          ...EMPTY,
          name: u.name ?? "",
          username: u.username ?? "",
          email: u.email ?? "",
          mobile_no: u.mobileNo ?? "",
          nid: u.nid ?? "",
          address: u.address ?? "",
          is_active: u.isActive ? "true" : "false",
          roles: u.roles || [],
          permissions: u.permissions || [],
          profile_image: u.profileImage ? assetUrl(u.profileImage) ?? undefined : undefined,
        }
        loadedRef.current = loaded
        reset(loaded)
      })
      .catch((e) => {
        console.error(e)
        dispatchShowToast({ type: "danger", message: t("Failed to load user") })
      })
      .finally(() => setLoading(false))
  }, [userId, reset, t])

  const photoChanged = isEdit && (values.profile_image ?? undefined) !== (loadedRef.current.profile_image ?? undefined)
  const changed = isDirty || photoChanged
  const setField = (name: string, value: unknown) => setValue(name as keyof UserFormValues, value as never, { shouldDirty: true, shouldValidate: !!errors[name as keyof UserFormValues] })

  const submitAdd = async (data: UserFormValues) => {
    // The inputs check uniqueness as you type; check again in case of a race.
    for (const [field, column, message] of [
      ["username", "Username", "Username already exists"],
      ["email", "Email", "Email already exists"],
      ["nid", "NID", "NID already exists"],
    ] as const) {
      const value = data[field] || ""
      if (value && (await checkValueExists("User", column, value))) {
        setError(field, { type: "manual", message: t(message) })
        return
      }
    }

    const payload = new window.FormData()
    payload.append("Name", data.name)
    payload.append("Username", data.username)
    payload.append("Email", data.email)
    payload.append("Password", data.password ?? "")
    payload.append("ConfirmedPassword", data.confirmed_password ?? "")
    payload.append("IsActive", data.is_active ?? "true")
    if (data.mobile_no) payload.append("MobileNo", data.mobile_no)
    if (data.nid) payload.append("NID", data.nid)
    if (data.profile_image instanceof File) payload.append("ProfileImage", data.profile_image)
    if (data.address) payload.append("Address", data.address)
    if (data.bio) payload.append("Bio", data.bio)
    if (data.gender) payload.append("Gender", data.gender)
    if (data.dob) payload.append("DateOfBirth", data.dob.toISOString())
    data.roles.forEach((role) => payload.append("Roles", role))
    data.permissions?.forEach((permission) => payload.append("Permissions", permission))

    const res = await createUsers(payload)
    if (res.status !== 200 && res.status !== 201) throw new Error(res.data?.message || "Registration failed")

    dispatchShowToast({ type: "success", message: t("User registered successfully!", "User registered successfully!"), duration: 5000 })
    reset(EMPTY)
    clearImage()
    await fetchData()
  }

  const submitEdit = async (data: UserFormValues) => {
    const payload = new FormData()
    // Only the fields the update endpoint takes.
    const fields: (keyof UserFormValues)[] = ["name", "username", "email", "mobile_no", "nid", "address", "is_active", "roles", "permissions"]
    for (const key of fields) {
      const value = data[key]
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) value.forEach((v) => payload.append(key, v))
      else payload.append(key, String(value))
    }
    if (data.profile_image instanceof File) {
      payload.append("profile_image", data.profile_image)
      payload.append("remove_profile_image", "false")
    } else {
      payload.append("remove_profile_image", !data.profile_image && preview === null ? "true" : "false")
    }

    const response = await updateUser(userId!, payload)
    if (response.status < 200 || response.status >= 300) throw new Error(response.data?.message || t("Update failed"))

    if (currentUserId === userId) await refreshUser()
    dispatchShowToast({ type: "success", message: t("User updated successfully") })
    await fetchData()
    props.onClose?.()
  }

  const onSubmit = async (data: UserFormValues) => {
    setSaving(true)
    try {
      await (isEdit ? submitEdit(data) : submitAdd(data))
    } catch (err) {
      console.error(err)
      const e = err as { message?: string; response?: { data?: { message?: string } } }
      dispatchShowToast({
        type: "danger",
        message: e.response?.data?.message || e.message || t("Something went wrong", "Something went wrong"),
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    reset(isEdit ? loadedRef.current : EMPTY)
    if (!isEdit) clearImage()
  }

  const except = isEdit ? { exceptFieldName: "Id", exceptFieldValue: userId } : {}
  const missingRequired = useMemo(
    () => [values.name, values.username, values.email].filter((v) => !v?.trim()).length + (values.roles?.length ? 0 : 1),
    [values.name, values.username, values.email, values.roles]
  )

  if (loading) return <FormSkeleton sections={3} />

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Who */}
      <FormSection icon={UserRound} title={t("Profile")} description={t("Name, sign-in name and email.")}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <AvatarPicker
            preview={preview}
            name={values.name || values.username || ""}
            onDrop={onDrop}
            onRemove={clearImage}
            error={errors.profile_image?.message}
            size="md"
            className="sm:pt-1"
          />
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <BasicInput id="name" label="Name" isRequired placeholder="Full Name" register={register("name")} error={errors.name} model={MODEL} />
            </div>
            <UniqueInput
              id="username"
              label="Username"
              placeholder="Username"
              model={MODEL}
              isRequired
              register={register("username")}
              error={errors.username}
              uniqueErrorMessage="Username already exists"
              field="Username"
              watchValue={values.username ?? ""}
              {...except}
            />
            <UniqueInput
              id="email"
              label="Email"
              placeholder="name@example.com"
              model={MODEL}
              isRequired
              register={register("email")}
              error={errors.email}
              uniqueErrorMessage="Email already exists"
              field="Email"
              watchValue={values.email ?? ""}
              {...except}
            />
          </div>
        </div>
      </FormSection>

      {/* Password (new users only; people change their own later) */}
      {!isEdit && (
        <FormSection icon={KeyRound} title={t("Password")} description={t("The user can change it after signing in.")}>
          <FieldGrid>
            <PasswordInput
              id="password"
              label="Password"
              placeholder="Enter password"
              autoComplete="new-password"
              isRequiredStar
              isHidden
              {...register("password")}
              error={errors.password?.message}
            />
            <PasswordInput
              id="confirmed_password"
              label="Confirm Password"
              placeholder="Confirm password"
              autoComplete="new-password"
              isRequiredStar
              isHidden
              {...register("confirmed_password")}
              error={errors.confirmed_password?.message}
            />
            <PasswordStrength value={values.password ?? ""} className="md:col-span-2" />
          </FieldGrid>
        </FormSection>
      )}

      {/* Access */}
      <FormSection icon={ShieldCheck} title={t("Access")} description={t("Roles grant permissions; add extra permissions only when a role doesn't cover it.")}>
        <div className="space-y-4">
          <CustomSelect<UserFormValues>
            id="roles"
            label="Roles"
            name="roles"
            setValue={setField as never}
            model={MODEL}
            apiUrl="/Options/roles"
            collection="Role"
            labelFields={["name"]}
            valueFields={["name"]}
            sortOrder="asc"
            isRequired
            placeholder="Select Roles"
            multiple
            value={values.roles}
            error={errors.roles && ("message" in errors.roles ? errors.roles : undefined)}
          />
          <CustomSelect<UserFormValues>
            id="permissions"
            label="Extra permissions"
            name="permissions"
            setValue={setField as never}
            model={MODEL}
            apiUrl="/Options/permissions"
            collection="Permission"
            labelFields={["name"]}
            valueFields={["name"]}
            sortOrder="asc"
            placeholder="Select Permissions"
            multiple
            value={values.permissions}
            error={errors.permissions?.[0]}
          />
          <SwitchField
            label={t("Active")}
            description={values.is_active === "false" ? t("This user can't sign in.") : t("This user can sign in.")}
            checked={values.is_active !== "false"}
            onChange={(on) => setField("is_active", on ? "true" : "false")}
          />
        </div>
      </FormSection>

      {/* Personal */}
      <FormSection icon={NotebookPen} title={t("Personal details")} description={t("Optional.")}>
        <FieldGrid>
          <UniqueInput
            id="mobile_no"
            label="Mobile No"
            field="MobileNo"
            placeholder="+8801XXXXXXXXX"
            register={register("mobile_no")}
            uniqueErrorMessage="Mobile Number already exists"
            error={errors.mobile_no}
            model={MODEL}
            watchValue={values.mobile_no ?? ""}
            {...except}
          />
          <UniqueInput
            id="nid"
            label="NID"
            placeholder="National ID Number"
            model={MODEL}
            register={register("nid")}
            error={errors.nid}
            uniqueErrorMessage="NID already exists"
            field="NID"
            watchValue={values.nid ?? ""}
            {...except}
          />
          {!isEdit && (
            <>
              <CustomSelect<UserFormValues>
                id="gender"
                label="Gender"
                name="gender"
                placeholder="Select Gender"
                options={GENDER_OPTIONS}
                error={errors.gender}
                setValue={setField as never}
                value={values.gender}
                model={MODEL}
              />
              <DateTimeInput
                id="dob"
                label="Date of Birth"
                name="dob"
                value={values.dob ?? null}
                setValue={(field: string, value: Date | null) => setField(field, value ?? undefined)}
                error={errors.dob}
                placeholder="Select date of birth"
                showTime={false}
                showResetButton
                model={MODEL}
              />
            </>
          )}
          <div className="md:col-span-2">
            <BasicTextarea id="address" label="Address" placeholder="Enter address" register={register("address")} error={errors.address} />
          </div>
          {!isEdit && (
            <div className="md:col-span-2">
              <BasicTextarea id="bio" label="Bio" placeholder="Enter bio" register={register("bio")} error={errors.bio} />
            </div>
          )}
        </FieldGrid>
      </FormSection>

      <SheetFooter
        status={
          isEdit ? (
            changed ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-warning" />
                {t("Unsaved changes")}
              </span>
            ) : (
              t("No changes yet")
            )
          ) : missingRequired > 0 ? (
            `${missingRequired} ${t("required fields left")}`
          ) : (
            <span className="text-success">{t("Ready to create")}</span>
          )
        }
      >
        <Button type="button" variant="ghost" onClick={resetForm} disabled={saving || (isEdit && !changed)}>
          <RotateCcw className="size-4" />
          {t("Reset")}
        </Button>
        <Button type="submit" disabled={saving || (isEdit && !changed)}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? <Save className="size-4" /> : <UserPlus className="size-4" />}
          {saving ? (isEdit ? t("Updating") : t("Creating")) + "…" : isEdit ? t("Save changes") : t("Create User")}
        </Button>
      </SheetFooter>
    </form>
  )
}
