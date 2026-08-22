// src/modules/profile/ProfileEdit.tsx
import { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { useAppSelector } from "@/hooks/useRedux"
import { getUserProfile, regenerateQr, updateProfile } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import DateTimeInput, {
  BasicInput,
  BasicTextarea,
  SingleImageInput,
  CustomSelect,
  UniqueInput
} from "@/components/custom/FormInputs"
import { GENDER_OPTIONS } from "@/constants"
import { useProfilePicture } from "@/hooks/useProfilePicture"
import { useTranslations } from "@/hooks/useTranslations"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Fancybox from "@/components/custom/FancyBox"
import { generateQRImage } from "@/lib/generateQRImage"
import { Loader2, QrCode, UserCircle, Mail, Phone, MapPin, FileText, Calendar, Shield, Key, Save } from "lucide-react"
import { capitalize } from "@/lib/helpers"
import Loader from "@/components/custom/Loader"
import { useRefreshAuth } from '@/hooks/useRefreshAuth';
import { useDispatch } from 'react-redux';

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

export default function ProfileEdit() {
  const { t } = useTranslations()
  const dispatch = useDispatch()
  const { refreshUser } = useRefreshAuth()
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrImg, setQrImg] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserProfileData | null>(null)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const model = "User"
  
  const hasLoadedRef = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors }
  } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: "",
      mobile_no: "",
      email: "",
      nid: "",
      address: "",
      bio: "",
      gender: "",
      date_of_birth: undefined,
      profile_image: undefined
    }
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
        
        const dateOfBirth = user.dateOfBirth ? new Date(user.dateOfBirth) : undefined
        
        reset({
          name: user.name ?? "",
          email: user.email ?? "",
          mobile_no: user.mobileNo ?? "",
          nid: user.nid ?? "",
          address: user.address ?? "",
          bio: user.bio ?? "",
          gender: user.gender ?? "",
          date_of_birth: dateOfBirth,
          profile_image: user.profileImage ?? undefined
        })

        if (user.profileImage && isMounted) {
          setValue("profile_image", import.meta.env.VITE_API_ASSET_URL + user.profileImage, { shouldValidate: false })
        }
        
        hasLoadedRef.current = true
        
      } catch (e) {
        console.log(e)
        if (isMounted) {
          dispatchShowToast({ type: "danger", message: t("Failed to load profile") })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
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
      
      hasLoadedRef.current = false
      
    } catch (err: any) {
      dispatchShowToast({
        type: "danger",
        message: err.response?.data || t("Update failed")
      })
    } finally {
      setSubmitLoading(false)
    }
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
    setValue(field as any, value || undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader type="circular" size={48} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 p-6">
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="p-2 rounded-xl bg-primary/10">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Edit Profile')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('Update your personal information and profile picture')}
                </p>
              </div>
            </div>

            {/* User Info Card */}
            {userData && (
              <div className="relative rounded-xl bg-muted/50 border border-border p-4 mb-4 overflow-hidden">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left Section - User Info */}
                  <div className="flex-1 min-w-[200px]">
                    {/* Username & Roles Row */}
                    <div className="flex flex-row flex-wrap items-start gap-6 mb-3">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Key className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t("Username")}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          @{userData.username}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Shield className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t("Roles")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {userData.roles?.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {capitalize(role)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Permissions Row */}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Shield className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("Permissions")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {userData.permissions?.slice(0, 8).map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {permission}
                          </span>
                        ))}
                        {userData.permissions && userData.permissions.length > 8 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            +{userData.permissions.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - QR Code */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-full flex items-center justify-center">
                      {userData.qrCode && qrImg ? (
                        <Fancybox
                          src={qrImg}
                          alt="QR Code"
                          title={userData.username}
                          description={`${userData.email}`}
                          isQRCode
                          className="w-20 h-20 rounded-xl shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      disabled={qrLoading}
                      onClick={handleRegenerateQr}
                      className="text-xs h-auto py-1.5"
                    >
                      {qrLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          <span>{t("Generating...")}</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-3 h-3 mr-1.5" />
                          <span>{userData.qrCode ? t("Regenerate QR") : t("Generate QR")}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Note about editing restrictions */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="text-base">ℹ️</span>
                    {t("Username, roles and permissions cannot be changed here. Contact administrator for changes.")}
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('Personal Information')}
                  </h3>
                </div>

                <BasicInput
                  id="name"
                  label={t("Full Name")}
                  isRequired
                  placeholder={t("Your full name")}
                  register={register("name")}
                  error={errors.name}
                  model={model}
                />
                
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomSelect
                    id="gender"
                    label={t("Gender")}
                    name="gender"
                    placeholder={t("Select Gender")}
                    options={GENDER_OPTIONS}
                    error={errors.gender}
                    setValue={setValue}
                    value={watch("gender")}
                    model={model}
                  />

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

              {/* Right Column */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('Additional Information')}
                  </h3>
                </div>

                <SingleImageInput
                  label={t("Profile Picture")}
                  preview={preview}
                  onDrop={onDrop}
                  clearImage={clearImage}
                  error={errors.profile_image}
                  className='text-center'
                  isRequired={false}
                  minHeightClass='h-[200px]'
                />

                <BasicTextarea
                  id="address"
                  label={t("Address")}
                  placeholder={t("Your complete address")}
                  register={register("address")}
                  error={errors.address}
                />

                <BasicTextarea
                  id="bio"
                  label={t("Bio")}
                  placeholder={t("Tell us something about yourself")}
                  register={register("bio")}
                  error={errors.bio}
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Saving...")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t("Save Changes")}
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