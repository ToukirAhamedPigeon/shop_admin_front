import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { checkValueExists } from '@/lib/validations'
import { useProfilePicture } from '@/hooks/useProfilePicture'
import DateTimeInput,{BasicInput, BasicTextarea, CustomSelect, PasswordInput, SingleImageInput, UniqueInput} from '@/components/custom/FormInputs'
import { useTranslations } from "@/hooks/useTranslations";
import { useAppDispatch } from '@/hooks/useRedux';
import { dispatchShowToast } from "@/lib/dispatch";
import { BOOLEAN_OPTIONS, GENDER_OPTIONS } from '@/constants'
import { createUsers } from '../api'

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const schema = z.object({
  // Name: required
  name: z.string().min(1, 'Name is required'),

  // Username: required, min 4 chars
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters'),

  // Email: required and valid
  email: z.string().email({ message: "Invalid email" }),

  // Password: required, min 6, must have uppercase, lowercase, number, special char
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

  // Confirm Password: must match password
  confirmed_password: z.string(),

  // Mobile: optional but min 11 digits if provided
  mobile_no: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 11, {
      message: "Mobile Number must be at least 11 digits",
    }),

  // NID: optional, but uniqueness handled via API
  nid: z.string().optional(),

  // Profile Image: optional, jpg/jpeg/png, max 500kb
  profile_image: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || ['image/jpeg','image/jpg','image/png'].includes(file.type), {
      message: "Profile image must be jpg, jpeg or png",
    })
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "Profile image must be less than 5MB",
    }),

  // Optional fields
  address: z.string().optional(),
  bio: z.string().optional(),
  blood_group: z.string().optional(),
  dob: z.coerce.date().optional(),
  is_active: z.string().optional(),
  gender: z.string().optional(),

  // Roles: optional array
  // Roles: required array, must have at least 1
  roles: z.array(z.string())
    .min(1, 'At least one role must be selected'),

  // Permissions: optional array
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


export default function Add({fetchData}:RegisterProps) {
  const { t } = useTranslations();
  const [submitLoading, setSubmitLoading] = useState(false)
  const model='User'
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
    blood_group: '',
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

  // const imagePic = watch('image')

  // Form Submit
  // UPDATED SUBMIT FUNCTION
  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);

    try {

      // 🔹 Server-side uniqueness should exist,
      // but keeping client-side pre-check as you had
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

      // 🔥 IMPORTANT: use different variable name to avoid shadowing FormData type
      const formDataPayload = new window.FormData(); // ✅ UPDATED


      formDataPayload.append("Name", data.name); // ✅ UPDATED (PascalCase)
      formDataPayload.append("Username", data.username); // ✅ UPDATED
      formDataPayload.append("Email", data.email); // ✅ UPDATED
      formDataPayload.append("Password", data.password); // ✅ UPDATED
      formDataPayload.append("ConfirmedPassword", data.confirmed_password); // ✅ UPDATED (fixed key)
      formDataPayload.append("IsActive", data.is_active ?? "true"); // ✅ UPDATED

      if (data.mobile_no)
        formDataPayload.append("MobileNo", data.mobile_no); // ✅ UPDATED

      if (data.nid)
        formDataPayload.append("NID", data.nid); // ✅ UPDATED (exact DTO name)

      // =============================
      // 🔹 Profile
      // =============================
      if (data.profile_image)
        formDataPayload.append("ProfileImage", data.profile_image); // ✅ UPDATED

      if (data.address)
        formDataPayload.append("Address", data.address); // ✅ UPDATED

      if (data.bio)
        formDataPayload.append("Bio", data.bio); // ✅ UPDATED (was description ❌)

      if (data.gender)
        formDataPayload.append("Gender", data.gender); // ✅ UPDATED

      if (data.dob)
        formDataPayload.append("DateOfBirth", data.dob.toISOString()); 

      data.roles.forEach(role => {
        formDataPayload.append("Roles", role); // ✅ UPDATED
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

  

  // Reset Handler
  const handleReset = () => {
    reset()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="flex items-center justify-center"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-2 w-full space-y-4">

      {/* Name + Username */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full space-y-4 flex flex-col justify-end">
          <div className="flex flex-col justify-end">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Provide User Information</h2>  
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Fill all required fields with (<span className="text-red-500 dark:text-red-400">*</span>) before submitting.
            </span>
         </div>
        
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
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Password"
            isRequiredStar={true}
            isHidden={true}
            {...register('password')}
            error={errors.password?.message}
          />
          <PasswordInput
            id="confirmed_password"
            label="Confirm Password"
            placeholder="Confirm Password"
            isRequiredStar={true}
            isHidden={true}
            {...register('confirmed_password')}
            error={errors.confirmed_password?.message}
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
      {/*  BP No + Email */}
      <div className="flex flex-col md:flex-row gap-4">
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

        <div className="flex flex-col md:flex-row gap-4">
          <UniqueInput
            id="mobile_no"
            label="Mobile No"
            field="MobileNo"
            isRequired={true}
            placeholder="Mobile No"
            register={register("mobile_no")}
            uniqueErrorMessage="Mobile Number already exists"
            error={errors.mobile_no}
            model={model}
            watchValue={watch('mobile_no') ||''}
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
        <div className="flex flex-col md:flex-row gap-4">
          <CustomSelect<FormData>
            id="is_active"
            label="Is Active?"
            name="is_active"
            placeholder="Select Current Status"
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
        <div className="flex flex-col md:flex-row gap-4">
          <DateTimeInput
            id="dob"
            label="Date of Birth"
            name="dob"
            value={watch('dob') ?? null}
            setValue={(field: string, value: Date | null) => setValue(field as any, value)}
            error={errors.dob}
            placeholder="Select your date of birth"
            showTime={false}
            showResetButton={true}
            model={model}
          />
          <UniqueInput
            id="nid"
            label="NID"
            placeholder="NID"
            model={model}
            isRequired={false}
            register={register('nid')}
            error={errors.nid}
            uniqueErrorMessage="NID already exists"
            field="NID"
            watchValue={watch('nid') ||''}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Address */}
          <BasicTextarea
            id="address"
            label="Address"
            placeholder="Enter a address"
            register={register("address")}
            error={errors.address}
          />
          {/* Bio */}
          <BasicTextarea
            id="bio"
            label="Bio"
            placeholder="Enter a bio"
            register={register("bio")}
            error={errors.bio}
          />
        </div>
        

        

        {/* Submit Actions */}
        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="btn-success-gradient" disabled={submitLoading}>
            {submitLoading ? t('Registering')+'...' : t('Register User')}
          </Button>
        </div>
        </form>

    </motion.div>
  )
}
