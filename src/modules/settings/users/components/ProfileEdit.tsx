// src/modules/settings/users/components/ProfileEdit.tsx
import { useState, useEffect, useRef, useMemo } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAppSelector } from "@/hooks/useRedux"
import { getUserProfile, regenerateQr, updateProfile } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import { AvatarPicker, FormSection, UnsavedBar } from "@/components/custom/FormKit"
import DateTimeInput, { BasicInput, BasicTextarea, CustomSelect, UniqueInput } from "@/components/custom/FormInputs"
import { GENDER_OPTIONS } from "@/constants"
import { useProfilePicture } from "@/hooks/useProfilePicture"
import { useTranslations } from "@/hooks/useTranslations"
import Fancybox from "@/components/custom/FancyBox"
import { generateQRImage } from "@/lib/generateQRImage"
import { Loader2, QrCode, Mail, AtSign, ShieldCheck, KeyRound, ChevronRight, UserRound, NotebookPen, Info } from "lucide-react"
import { capitalize } from "@/lib/helpers"
import { can } from "@/lib/authCheck"
import { cn } from "@/lib/utils"
import { useRefreshAuth } from "@/hooks/useRefreshAuth"
import { groupPermissions, moduleLabel } from "@/modules/settings/roles-permissions/components/permissionMeta"

// Schema for Profile Edit - only personal fields
export const profileEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email({ message: "Invalid email" }),
  mobile_no: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 11, {
      message: "Mobile Number must be at least 11 digits",
    }),
  nid: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.date().optional(),
  profile_image: z.union([
    z.instanceof(File),
    z.string(),
    z.undefined()
  ]).optional(),
})

export type ProfileEditFormValues = z.infer<typeof profileEditSchema> & {
  date_of_birth?: Date | null;
}

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  qrCode?: string | null;
}

const EMPTY: ProfileEditFormValues = {
  name: "",
  mobile_no: "",
  email: "",
  nid: "",
  address: "",
  bio: "",
  gender: "",
  date_of_birth: undefined,
  profile_image: undefined,
}

// Fields that count towards "profile complete".
const COMPLETENESS: (keyof ProfileEditFormValues)[] = ["name", "email", "mobile_no", "profile_image", "gender", "date_of_birth", "address", "bio"]

function ProfileSkeleton() {
  return (
    <div className="grid animate-pulse gap-5 lg:grid-cols-[320px_minmax(0,1fr)]" aria-hidden>
      <div className="space-y-4">
        <div className="h-80 rounded-xl bg-muted/70" />
        <div className="h-40 rounded-xl bg-muted/70" />
      </div>
      <div className="space-y-4">
        <div className="h-72 rounded-xl bg-muted/70" />
        <div className="h-64 rounded-xl bg-muted/70" />
      </div>
    </div>
  )
}

export default function ProfileEdit() {
  const { t } = useTranslations()
  const { refreshUser } = useRefreshAuth()
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrImg, setQrImg] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserProfileData | null>(null)
  const [showAllAccess, setShowAllAccess] = useState(false)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const model = "User"

  const hasLoadedRef = useRef(false)
  // The values as last loaded or saved: what "Discard" goes back to.
  const savedRef = useRef<ProfileEditFormValues>(EMPTY)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: EMPTY,
  })

  const { preview, clearImage, onDrop } = useProfilePicture(
    setValue,
    setError,
    "profile_image",
    watch("profile_image") ?? undefined
  )

  useEffect(() => {
    if (userData?.qrCode) {
      generateQRImage(userData.qrCode).then(setQrImg)
    } else {
      setQrImg(null)
    }
  }, [userData?.qrCode])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (hasLoadedRef.current || !userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await getUserProfile()
        if (!isMounted) return

        const user = res.data
        setUserData(user)

        const values: ProfileEditFormValues = {
          name: user.name ?? "",
          email: user.email ?? "",
          mobile_no: user.mobileNo ?? "",
          nid: user.nid ?? "",
          address: user.address ?? "",
          bio: user.bio ?? "",
          gender: user.gender ?? "",
          date_of_birth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
          profile_image: user.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined,
        }
        savedRef.current = values
        reset(values)
        hasLoadedRef.current = true
      } catch (e) {
        console.log(e)
        if (isMounted) {
          dispatchShowToast({ type: "danger", message: t("Failed to load profile") })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [userId])

  const profileImg = watch("profile_image")
  const prevProfileImgRef = useRef(profileImg)

  useEffect(() => {
    if (!loading) {
      if (!profileImg && prevProfileImgRef.current) {
        clearImage()
      }
      prevProfileImgRef.current = profileImg
    }
  }, [profileImg, loading, clearImage])

  // The photo is set without marking the form dirty, so compare it directly.
  const imageChanged = profileImg !== savedRef.current.profile_image
  const hasChanges = isDirty || imageChanged

  const onSubmit = async (data: ProfileEditFormValues) => {
    setSubmitLoading(true)
    try {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (key === 'profile_image') return

        if (value instanceof Date) {
          formData.append(key, value.toISOString())
        } else {
          formData.append(key, String(value))
        }
      })

      const currentProfileImage = watch("profile_image")

      if (currentProfileImage instanceof File) {
        formData.append("profile_image", currentProfileImage)
        formData.append("remove_profile_image", "false")
      } else if (!currentProfileImage && preview === null) {
        formData.append("remove_profile_image", "true")
      } else {
        formData.append("remove_profile_image", "false")
      }

      await updateProfile(formData)
      await refreshUser()
      dispatchShowToast({
        type: "success",
        message: t("Profile updated successfully")
      })

      // What was just saved is the new baseline for Discard and the save bar.
      savedRef.current = getValues()
      reset(getValues())
    } catch (err: any) {
      dispatchShowToast({
        type: "danger",
        message: err.response?.data || t("Update failed")
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const discard = () => {
    reset(savedRef.current)
  }

  const handleRegenerateQr = async () => {
    if (!userData?.id) return

    setQrLoading(true)
    try {
      const res = await regenerateQr(userData.id)

      setUserData(prev => prev ? { ...prev, qrCode: res.data.qrCode } : null)
      generateQRImage(res.data.qrCode).then(setQrImg)

      dispatchShowToast({
        type: "success",
        message: t("QR Code regenerated successfully"),
      })
    } catch (err: any) {
      dispatchShowToast({
        type: "danger",
        message: err.response?.data || t("Failed to regenerate QR"),
      })
    } finally {
      setQrLoading(false)
    }
  }

  const handleDateChange = (field: string, value: Date | null) => {
    setValue(field as any, value || undefined, { shouldDirty: true })
  }

  const values = watch()
  const completeness = useMemo(() => {
    const filled = COMPLETENESS.filter((k) => {
      const v = values[k]
      return v instanceof Date || v instanceof File || (typeof v === "string" && v.trim() !== "")
    }).length
    return Math.round((filled / COMPLETENESS.length) * 100)
  }, [values])

  const access = useMemo(() => groupPermissions(userData?.permissions ?? []), [userData?.permissions])
  const visibleAccess = showAllAccess ? access : access.slice(0, 6)
  const canChangePassword = can(["change-admin-password"])

  if (loading) return <ProfileSkeleton />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Left: who you are */}
      <aside className="space-y-4 lg:sticky lg:top-20">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="dash-hero relative h-24" aria-hidden />
          <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
            <AvatarPicker
              preview={preview}
              name={values.name || userData?.username || ""}
              onDrop={onDrop}
              onRemove={clearImage}
              error={errors.profile_image?.message}
            />

            <p className="mt-3 max-w-full truncate text-lg font-semibold text-foreground">{values.name || t("Your name")}</p>
            {userData && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <AtSign className="size-3.5" />
                {userData.username}
              </p>
            )}
            {values.email && (
              <p className="mt-0.5 flex max-w-full items-center gap-1 truncate text-sm text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{values.email}</span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {userData?.roles?.map((role) => (
                <span key={role} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {capitalize(role)}
                </span>
              ))}
            </div>

            <div className="mt-5 w-full text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("Profile complete")}</span>
                <span className="font-semibold tabular-nums text-foreground">{completeness}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100}>
                <div className={cn("h-full rounded-full transition-[width] duration-300", completeness === 100 ? "bg-success" : "bg-primary")} style={{ width: `${completeness}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* QR */}
        {userData && (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
            {userData.qrCode && qrImg ? (
              <Fancybox src={qrImg} alt="QR Code" title={userData.username} description={`${userData.email}`} isQRCode className="size-20 shrink-0 rounded-lg bg-white p-1" />
            ) : (
              <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <QrCode className="size-8" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("Your QR code")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{userData.qrCode ? t("Click it to view larger.") : t("No QR code yet.")}</p>
              <Button type="button" variant="outline" size="sm" disabled={qrLoading} onClick={handleRegenerateQr} className="mt-2 h-8">
                {qrLoading ? <Loader2 className="size-3.5 animate-spin" /> : <QrCode className="size-3.5" />}
                {qrLoading ? t("Generating...") : userData.qrCode ? t("Regenerate") : t("Generate")}
              </Button>
            </div>
          </div>
        )}

        {/* Access */}
        {userData && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              {t("Your access")}
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {userData.permissions?.length ?? 0}
              </span>
            </p>
            {access.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{t("No permissions assigned.")}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {visibleAccess.map((g) => (
                  <li key={g.module} title={`${moduleLabel(g.module)}: ${g.actions.join(", ")}`} className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-foreground/85">
                    {moduleLabel(g.module)}
                    <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold tabular-nums text-primary">{g.actions.length}</span>
                  </li>
                ))}
                {access.length > 6 && (
                  <li>
                    <button type="button" onClick={() => setShowAllAccess((v) => !v)} className="cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10">
                      {showAllAccess ? t("Show less") : `+${access.length - 6} ${t("more")}`}
                    </button>
                  </li>
                )}
              </ul>
            )}
            <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              {t("Username, roles and permissions are managed by an administrator.")}
            </p>
          </div>
        )}

        {canChangePassword && (
          <Link
            to="/settings/change-password"
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <KeyRound className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{t("Change password")}</span>
              <span className="block text-xs text-muted-foreground">{t("Keep your account secure")}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </aside>

      {/* Right: the form */}
      <div className="min-w-0 space-y-5">
        <FormSection icon={UserRound} title={t("Personal details")} description={t("How people see and reach you.")}>
          <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <BasicInput id="name" label={t("Full Name")} isRequired placeholder={t("Your full name")} register={register("name")} error={errors.name} model={model} />
            </div>
            <UniqueInput
              id="email"
              label={t("Email Address")}
              placeholder="your@email.com"
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
            <UniqueInput
              id="mobile_no"
              label={t("Mobile Number")}
              field="MobileNo"
              isRequired={false}
              placeholder="+8801XXXXXXXXX"
              register={register("mobile_no")}
              uniqueErrorMessage={t("Mobile Number already exists")}
              error={errors.mobile_no}
              model={model}
              exceptFieldName="Id"
              exceptFieldValue={userId}
              watchValue={watch("mobile_no") || ""}
            />
            <UniqueInput
              id="nid"
              label={t("NID Number")}
              placeholder="National ID Number"
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
            <CustomSelect
              id="gender"
              label={t("Gender")}
              name="gender"
              placeholder={t("Select Gender")}
              options={GENDER_OPTIONS}
              error={errors.gender}
              setValue={(name: string, v: unknown) => setValue(name as keyof ProfileEditFormValues, v as never, { shouldDirty: true })}
              value={watch("gender")}
              model={model}
            />
            <div className="md:col-span-2 md:max-w-[calc(50%-10px)]">
              <DateTimeInput
                id="date_of_birth"
                label={t("Date of Birth")}
                name="date_of_birth"
                value={watch('date_of_birth') ?? null}
                setValue={handleDateChange}
                error={errors.date_of_birth}
                placeholder={t("Select date of birth")}
                showTime={false}
                showResetButton={true}
                model={model}
              />
            </div>
          </div>
        </FormSection>

        <FormSection icon={NotebookPen} title={t("About you")} description={t("Optional details shown on your profile.")}>
          <div className="grid gap-4">
            <BasicTextarea id="bio" label={t("Bio")} placeholder={t("Tell us something about yourself")} register={register("bio")} error={errors.bio} />
            <BasicTextarea id="address" label={t("Address")} placeholder={t("Your complete address")} register={register("address")} error={errors.address} />
          </div>
        </FormSection>
      </div>

      {/* Unsaved changes: sticky within the page, so it never covers the sidebar. */}
      <UnsavedBar show={hasChanges} saving={submitLoading} onDiscard={discard} className="sticky bottom-3 lg:col-start-2" />
    </form>
  )
}
