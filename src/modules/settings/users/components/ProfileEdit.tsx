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
import { Loader2, QrCode } from "lucide-react"
import { capitalize } from "@/lib/helpers"
import Loader from "@/components/custom/Loader" // Import Loader

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
  // ... other fields from your API response
}

export default function ProfileEdit() {
  const { t } = useTranslations()
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrImg, setQrImg] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserProfileData | null>(null)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const model = "User"
  
  // Add a ref to track if data has been loaded
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

  // Profile Picture Hook
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

  // Fetch User Profile Data - without problematic dependencies
  useEffect(() => {
    let isMounted = true
    
    const loadProfile = async () => {
      // Skip if already loaded or no userId
      if (hasLoadedRef.current || !userId) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const res = await getUserProfile()
        
        // Only update state if component is still mounted
        if (!isMounted) return
        
        const user = res.data
        setUserData(user)
        
        // Parse date if it exists
        const dateOfBirth = user.dateOfBirth ? new Date(user.dateOfBirth) : undefined
        
        // Reset form with new data
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
        
        // Mark as loaded
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
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [userId]) // Only depend on userId - reset and setValue removed!

  // Separate effect for setting profile image URL (runs only once after data is loaded)
  useEffect(() => {
    // This effect now only handles the profile image URL
    // The actual data loading is handled above
  }, [])

  // Sync profile image - with proper cleanup
  const profileImg = watch("profile_image")
  const prevProfileImgRef = useRef(profileImg)

  useEffect(() => {
    // Only run after initial load is complete
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
      
      // Append all fields
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (key === 'profile_image') return
        
        if (value instanceof Date) {
          formData.append(key, value.toISOString())
        } else {
          formData.append(key, String(value))
        }
      })
      
      // Handle profile image
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

      dispatchShowToast({ 
        type: "success", 
        message: t("Profile updated successfully") 
      })
      
      // Reset the loaded flag so data can be reloaded if needed
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

  // Handle QR Code regeneration
  const handleRegenerateQr = async () => {
        if (!userData?.id) return
        
        setQrLoading(true)
        try {
        const res = await regenerateQr(userData.id)
        
        // Update user data with new QR code
        setUserData(prev => prev ? { ...prev, qrCode: res.data.qrCode } : null)
        
        // Generate new QR image
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

  // Handler for DateTimeInput
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        {userData && (
            <Card className="p-3 bg-slate-50 dark:bg-slate-800/50 mb-4">
                <div className="flex items-start justify-between gap-4">
                {/* Left Section - User Info */}
                <div className="flex-1 grid grid-rows-1 sm:grid-rows-2 gap-3">
                    <div className="flex flex-row justify-start items-center gap-10">
                        {/* Username */}
                        <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            {t("Username")}
                        </span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            @{userData.username}
                        </span>
                        </div>

                        {/* Roles */}
                        <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            {t("Roles")}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                            {userData.roles?.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                                {capitalize(role)}
                            </Badge>
                            ))}
                        </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        {t("Permissions")}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {userData.permissions?.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                        </Badge>
                        ))}
                    </div>
                    </div>
                </div>

                {/* Right Section - QR Code only (no text) */}
                <div className="flex-col items-center justify-center space-y-2">
                    <div className="w-full flex items-center justify-center">
                    {userData.qrCode && qrImg ? (
                    <Fancybox
                        src={qrImg}
                        alt="QR Code"
                        title={userData.username}
                        description={`${userData.email}`}
                        isQRCode
                        className="w-20 h-20"
                    />
                    ) : (
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-slate-400" />
                    </div>
                    )}
                    </div>

                    {/* Regenerate QR Button - Small and Compact */}
                    <button
                    type="button"
                    disabled={qrLoading}
                    onClick={handleRegenerateQr}
                    className={`
                        px-2 py-1 text-xs rounded-md 
                        bg-indigo-600 hover:bg-indigo-700 
                        text-white shadow-sm transition cursor-pointer
                        disabled:opacity-60 disabled:cursor-not-allowed
                        flex items-center gap-1
                    `}
                    >
                    {qrLoading ? (
                        <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="">{t("Generating...")}</span>
                        </>
                    ) : (
                        <>
                        <QrCode className="w-3 h-3" />
                        <span className="">
                            {userData.qrCode ? t("Regenerate") : t("Generate")}
                        </span>
                        </>
                    )}
                    </button>
                </div>
                </div>

                {/* Note about editing restrictions - Compact */}
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                ℹ️ {t("Username, roles and permissions cannot be changed here. Contact administrator for changes.")}
                </p>
            </Card>
            )}
        <div className="flex flex-col md:flex-row gap-4 justify-end">
          <div className="w-full space-y-4">
            <BasicInput
              id="name"
              label={t("Name")}
              isRequired
              placeholder={t("Your Name")}
              register={register("name")}
              error={errors.name}
              model={model}
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
              placeholder={t("Select your date of birth")}
              showTime={false}
              showResetButton={true}
              model={model}
            />
          </div>

          <div className="w-full space-y-4">
            <SingleImageInput
              label={t("Profile Picture")}
              preview={preview}
              onDrop={onDrop}
              clearImage={clearImage}
              error={errors.profile_image}
              className='text-center'
              isRequired={false}
              minHeightClass='h-[250px]'
            />

            <BasicTextarea
              id="address"
              label={t("Address")}
              placeholder={t("Your address")}
              register={register("address")}
              error={errors.address}
            />

            <BasicTextarea
              id="bio"
              label={t("Bio")}
              placeholder={t("Tell us about yourself")}
              register={register("bio")}
              error={errors.bio}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6 border-t border-gray-300 pt-4">
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={submitLoading}>
            {submitLoading ? t("Saving...") : t("Save Changes")}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}