'use client'

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

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmed_password: z.string().min(1, 'Confirmed password is required'),

  // ✅ FIXED IMAGE TYPE
  image: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), {
      message: "Only image files are allowed",
    })
    .optional(),

  bp_no: z.string().optional(),
  phone_1: z.string().min(11, 'Phone Number must be at least 11 digits').optional(),
  phone_2: z.string().optional(),
  address: z.string().optional(),
  blood_group: z.string().optional(),
  nid: z.string().optional(),

  // ✅ keep this (works fine)
  dob: z.coerce.date().optional(),

  description: z.string().optional(),

  current_status: z.string().min(1, 'Status is required'),

  role_ids: z
    .array(
      z.string().regex(objectIdRegex, {
        message: "Each role ID must be a valid ObjectId",
      })
    )
    .nonempty({ message: "Please select at least one role" }),

  permission_ids: z.array(
    z.string().regex(objectIdRegex, {
      message: "Each permission ID must be a valid ObjectId",
    })
  )
}).refine(
  (data) => data.password === data.confirmed_password,
  {
    path: ['confirmed_password'],
    message: "Passwords don't match",
  }
);

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
    image: undefined,
    bp_no: '',
    phone_1: '',
    phone_2: '',
    address: '',
    blood_group: '',
    nid: '',
    dob: undefined,
    description: '',
    current_status: 'Active',
    role_ids: [],
    permission_ids: []
  }
})

  const {
    preview,
    clearImage,
    onDrop,
  } = useProfilePicture(setValue, setError, 'image', watch('image'));

  // const imagePic = watch('image')

  // Form Submit
  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);
  
    try {
      // Check if username is already taken
      const usernameTaken = await checkValueExists("User", "username", data.username);
      if (usernameTaken) {
        setError("username", { type: "manual", message: "Username already exists" });
        setSubmitLoading(false);
        return;
      }
  
      // Check if bp_no is taken (if provided)
      if (data.bp_no && data.bp_no.trim().length > 0) {
        const bpNoTaken = await checkValueExists("User", "bp_no", data.bp_no);
        if (bpNoTaken) {
          setError("bp_no", { type: "manual", message: "BP No already exists" });
          setSubmitLoading(false);
          return;
        }
      }
  
      // Prepare data for submission
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("username", data.username);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmed_password", data.confirmed_password);
      formData.append("current_status", data.current_status);
      formData.append("dob", data.dob?.toISOString() ?? "");
  
      if (data.image) formData.append("image", data.image);
      if (data.bp_no) formData.append("bp_no", data.bp_no);
      if (data.phone_1) formData.append("phone_1", data.phone_1);
      if (data.phone_2) formData.append("phone_2", data.phone_2);
      if (data.address) formData.append("address", data.address);
      if (data.blood_group) formData.append("blood_group", data.blood_group);
      if (data.nid) formData.append("nid", data.nid);
      if (data.description) formData.append("description", data.description);
  
      // Append role_ids and permission_ids as JSON
      formData.append("role_ids", JSON.stringify(data.role_ids));
      formData.append("permission_ids", JSON.stringify(data.permission_ids));
  
      // const res = await api.post("/users/register", formData, {
      //   headers: {
      //     Authorization: `Bearer ${token}`, // make sure token is available in scope
      //     "Content-Type": "multipart/form-data",
      //   },
      // });
  
      // const result = res.data;
  
      // if (!result.success) {
      //   throw new Error(result.message || "Registration failed");
      // }
      // await initAuthUser(dispatch, true);
      // dispatchShowToast({
      //       type: "success",
      //       message: t("User registered successfully!","User registered successfully!"),
      //       duration: 10000,
      //     });
      reset(); // Reset form values
      await fetchData();
  
    } catch (error: any) {
      console.error(error);
      dispatchShowToast({
         type: "danger",
         message: error.message || t("Something went wrong during registration","Something went wrong during registration"),
            duration: 10000,
      })
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
      <form onSubmit={handleSubmit(onSubmit)} className="p-3 w-full space-y-4">

      {/* Name + Username */}
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
          id="username"
          label="Username"
          placeholder="Username"
          model={model}
          isRequired={true}
          register={register('username')}
          error={errors.username}
          uniqueErrorMessage="Username already exists"
          field="username"
          watchValue={watch('username')}
        />
      </div>

      {/* Password + Confirm Password */}
      <div className="flex flex-col md:flex-row gap-4">
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

      {/*  BP No + Email */}
      <div className="flex flex-col md:flex-row gap-4">
        <UniqueInput
            id="email"
            label="Email"
            placeholder="Email"
            model={model}
            register={register('email')}
            error={errors.email}
            uniqueErrorMessage="Email already exists"
            field="email"
            isRequired={true}
            watchValue={watch('email')}
        />
        <UniqueInput
            id="bp_no"
            label="BP No"
            placeholder="BP No"
            model={model}
            register={register('bp_no')}
            error={errors.bp_no}
            uniqueErrorMessage="BP No already exists"
            field="bp_no"
            watchValue={watch('bp_no') ?? ''}
          />
      </div>

        {/* Phone 1 + Phone 2 */}
        <div className="flex flex-col md:flex-row gap-4">
          <BasicInput
            id="phone_1"
            label="Phone 1"
            type="number"
            isRequired={true}
            placeholder="Phone 1"
            register={register("phone_1")}
            error={errors.phone_1}
            model={model}
            onWheel={(e) => e.currentTarget.blur()}
          />
          <BasicInput
            id="phone_2"
            label="Phone 2"
            type="number"
            placeholder="Phone 2"
            register={register("phone_2")}
            error={errors.phone_2}
            model={model}
            onWheel={(e) => e.currentTarget.blur()}
          />
        </div>

        {/* Blood Group + Current Status */}
        <div className="flex flex-col md:flex-row gap-4">
          <CustomSelect<FormData>
            id="current_status"
            label="Current Status"
            name="current_status"
            placeholder="Select Current Status"
            isRequired={true}
            options={[
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
            error={errors.current_status}
            setValue={setValue}
            value={watch("current_status")}
            model={model}
          />
          <CustomSelect<FormData>
            id="role_ids"
            label="Roles"
            name="role_ids"
            setValue={setValue}
            model="User"
            apiUrl="/get-options"
            collection="Role"
            labelFields={["name"]}
            valueFields={["_id"]}
            sortOrder="asc"
            isRequired={true}
            placeholder="Select Roles"
            multiple={true}
            value={watch("role_ids")}
            error={errors.role_ids?.[0]}
          />
        </div>

        <CustomSelect<FormData>
            id="permission_ids"
            label="Permissions"
            name="permission_ids"
            setValue={setValue}
            model="User"
            apiUrl="/get-options"
            collection="Permission"
            labelFields={["name"]}
            valueFields={["_id"]}
            sortOrder="asc"
            isRequired={false}
            placeholder="Select Permissions"
            multiple={true}
            value={watch("permission_ids")}
            error={errors.permission_ids?.[0]}
          />

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
          <BasicInput
            id="nid"
            label="NID"
            placeholder="NID"
            register={register("nid")}
            error={errors.nid}
            model={model}
          />
        </div>

          {/* Profile Picture */}
          <SingleImageInput
            label="Profile Picture"
            preview={preview}
            onDrop={onDrop}
            clearImage={clearImage}
            error={errors.image}
            isRequired={false}
          />

        {/* Address */}
         <BasicTextarea
          id="address"
          label="Address"
          placeholder="Enter a address"
          register={register("address")}
          error={errors.address}
        />
        {/* Description */}
        <BasicTextarea
          id="description"
          label="Description"
          placeholder="Enter a description"
          register={register("description")}
          error={errors.description}
        />

        

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
