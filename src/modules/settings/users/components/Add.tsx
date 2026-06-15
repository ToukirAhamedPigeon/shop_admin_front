// src/modules/users/components/Add.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { checkValueExists } from '@/lib/validations'
import { useProfilePicture } from '@/hooks/useProfilePicture'
import DateTimeInput, { BasicInput, BasicTextarea, CustomSelect, PasswordInput, SingleImageInput, UniqueInput } from '@/components/custom/FormInputs'
import { useTranslations } from "@/hooks/useTranslations";
import { useAppDispatch } from '@/hooks/useRedux';
import { dispatchShowToast } from "@/lib/dispatch";
import { BOOLEAN_OPTIONS, GENDER_OPTIONS } from '@/constants'
import { createUsers } from '../api'
import { UserPlus, Shield, Mail, Phone, Key, Calendar, MapPin, FileText, User as UserIcon } from 'lucide-react'
import { useAppSelector } from '@/hooks/useRedux'

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  email: z.string().email({ message: "Invalid email" }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Password must contain at least one number",
    })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
      message: "Password must contain at least one special character",
    }),
  confirmed_password: z.string(),
  mobile_no: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 11, {
      message: "Mobile Number must be at least 11 digits",
    }),
  nid: z.string().optional(),
  profile_image: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type), {
      message: "Profile image must be jpg, jpeg or png",
    })
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "Profile image must be less than 5MB",
    }),
  address: z.string().optional(),
  bio: z.string().optional(),
  blood_group: z.string().optional(),
  dob: z.coerce.date().optional(),
  is_active: z.string().optional(),
  gender: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role must be selected'),
  permissions: z.array(z.string()).optional(),
})
.refine((data) => data.password === data.confirmed_password, {
  path: ['confirmed_password'],
  message: "Passwords don't match",
});

type FormData = z.infer<typeof schema>

interface RegisterProps {
  fetchData: () => Promise<void>;
}

export default function Add({ fetchData }: RegisterProps) {
  const { t } = useTranslations();
  const [submitLoading, setSubmitLoading] = useState(false)
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'
  const model = 'User'
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmed_password: '',
      profile_image: undefined,
      mobile_no: '',
      address: '',
      nid: '',
      dob: undefined,
      bio: '',
      is_active: 'true',
      gender: 'male',
      roles: [],
      permissions: []
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const {
    preview,
    clearImage,
    onDrop,
  } = useProfilePicture(setValue, setError, 'profile_image', watch('profile_image'));

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);
    try {
      const usernameTaken = await checkValueExists("User", "Username", data.username);
      if (usernameTaken) {
        setError("username", { type: "manual", message: "Username already exists" });
        return;
      }

      const emailTaken = await checkValueExists("User", "Email", data.email);
      if (emailTaken) {
        setError("email", { type: "manual", message: "Email already exists" });
        return;
      }

      const nidTaken = await checkValueExists("User", "NID", data.nid || "");
      if (nidTaken) {
        setError("nid", { type: "manual", message: "NID already exists" });
        return;
      }

      const formDataPayload = new window.FormData();
      formDataPayload.append("Name", data.name);
      formDataPayload.append("Username", data.username);
      formDataPayload.append("Email", data.email);
      formDataPayload.append("Password", data.password);
      formDataPayload.append("ConfirmedPassword", data.confirmed_password);
      formDataPayload.append("IsActive", data.is_active ?? "true");

      if (data.mobile_no)
        formDataPayload.append("MobileNo", data.mobile_no);
      if (data.nid)
        formDataPayload.append("NID", data.nid);
      if (data.profile_image)
        formDataPayload.append("ProfileImage", data.profile_image);
      if (data.address)
        formDataPayload.append("Address", data.address);
      if (data.bio)
        formDataPayload.append("Bio", data.bio);
      if (data.gender)
        formDataPayload.append("Gender", data.gender);
      if (data.dob)
        formDataPayload.append("DateOfBirth", data.dob.toISOString());

      data.roles.forEach(role => {
        formDataPayload.append("Roles", role);
      });

      data.permissions?.forEach(permission => {
        formDataPayload.append("Permissions", permission);
      });

      const res = await createUsers(formDataPayload);
      const result = res.data;

      if (res.status !== 200 && res.status !== 201) {
        throw new Error(result.message || "Registration failed");
      }

      dispatchShowToast({
        type: "success",
        message: t("User registered successfully!", "User registered successfully!"),
        duration: 5000,
      });

      reset();
      await fetchData();

    } catch (error: any) {
      console.error(error);
      dispatchShowToast({
        type: "danger",
        message: error.message || t("Something went wrong", "Something went wrong"),
        duration: 5000,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    reset()
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
        
        {/* Colored accent line at top */}
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {t('Add New User')}
                </h2>
                <p 
                  className="text-sm text-gray-500 dark:text-gray-400"
                  dangerouslySetInnerHTML={{ 
                    __html: t('Fill all required fields with (<span class="text-red-500">*</span>) before submitting.')
                  }}
                />
              </div>
            </div>

            {/* Name + Username + Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <BasicInput
                id="name"
                label="Name"
                isRequired
                placeholder="Full Name"
                register={register("name")}
                error={errors.name}
                model={model}
              />
              <UniqueInput
                id="username"
                label="Username"
                placeholder="Username"
                model={model}
                isRequired={true}
                register={register('username')}
                error={errors.username}
                uniqueErrorMessage="Username already exists"
                field="Username"
                watchValue={watch('username')}
              />
              <UniqueInput
                id="email"
                label="Email"
                placeholder="Email"
                model={model}
                register={register('email')}
                error={errors.email}
                uniqueErrorMessage="Email already exists"
                field="Email"
                isRequired={true}
                watchValue={watch('email')}
              />
            </div>

            {/* Password Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('Security Settings')}
                  </h3>
                </div>
                <PasswordInput
                  id="password"
                  label="Password"
                  placeholder="Enter password"
                  isRequiredStar={true}
                  isHidden={true}
                  {...register('password')}
                  error={errors.password?.message}
                />
                <PasswordInput
                  id="confirmed_password"
                  label="Confirm Password"
                  placeholder="Confirm password"
                  isRequiredStar={true}
                  isHidden={true}
                  {...register('confirmed_password')}
                  error={errors.confirmed_password?.message}
                />
              </div>

              {/* Profile Picture */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('Profile Picture')}
                  </h3>
                </div>
                <SingleImageInput
                  label=""
                  preview={preview}
                  onDrop={onDrop}
                  clearImage={clearImage}
                  error={errors.profile_image}
                  className='text-center'
                  isRequired={false}
                  minHeightClass='h-[180px]'
                />
              </div>
            </div>

            {/* Mobile + Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <UniqueInput
                id="mobile_no"
                label="Mobile No"
                field="MobileNo"
                isRequired={false}
                placeholder="Mobile Number"
                register={register("mobile_no")}
                uniqueErrorMessage="Mobile Number already exists"
                error={errors.mobile_no}
                model={model}
                watchValue={watch('mobile_no') || ''}
              />
              <CustomSelect<FormData>
                id="roles"
                label="Roles"
                name="roles"
                setValue={setValue}
                model="User"
                apiUrl="/Options/roles"
                collection="Role"
                labelFields={["name"]}
                valueFields={["name"]}
                sortOrder="asc"
                isRequired={true}
                placeholder="Select Roles"
                multiple={true}
                value={watch("roles")}
                error={errors.roles && ('message' in errors.roles ? errors.roles : undefined)}
              />
            </div>

            {/* Permissions */}
            <CustomSelect<FormData>
              id="permissions"
              label="Permissions"
              name="permissions"
              setValue={setValue}
              model="User"
              apiUrl="/Options/permissions"
              collection="Permission"
              labelFields={["name"]}
              valueFields={["name"]}
              sortOrder="asc"
              isRequired={false}
              placeholder="Select Permissions"
              multiple={true}
              value={watch("permissions")}
              error={errors.permissions?.[0]}
            />

            {/* Status + Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CustomSelect<FormData>
                id="is_active"
                label="Status"
                name="is_active"
                placeholder="Select Status"
                isRequired={true}
                options={BOOLEAN_OPTIONS}
                error={errors.is_active}
                setValue={setValue}
                value={watch("is_active")}
                model={model}
              />
              <CustomSelect<FormData>
                id="gender"
                label="Gender"
                name="gender"
                placeholder="Select Gender"
                isRequired={false}
                options={GENDER_OPTIONS}
                error={errors.gender}
                setValue={setValue}
                value={watch("gender")}
                model={model}
              />
            </div>

            {/* DOB + NID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DateTimeInput
                id="dob"
                label="Date of Birth"
                name="dob"
                value={watch('dob') ?? null}
                setValue={(field: string, value: Date | null) => setValue(field as any, value)}
                error={errors.dob}
                placeholder="Select date of birth"
                showTime={false}
                showResetButton={true}
                model={model}
              />
              <UniqueInput
                id="nid"
                label="NID"
                placeholder="National ID Number"
                model={model}
                isRequired={false}
                register={register('nid')}
                error={errors.nid}
                uniqueErrorMessage="NID already exists"
                field="NID"
                watchValue={watch('nid') || ''}
              />
            </div>

            {/* Address + Bio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <BasicTextarea
                id="address"
                label="Address"
                placeholder="Enter address"
                register={register("address")}
                error={errors.address}
              />
              <BasicTextarea
                id="bio"
                label="Bio"
                placeholder="Enter bio"
                register={register("bio")}
                error={errors.bio}
              />
            </div>

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
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('Creating')}...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('Create User')}
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