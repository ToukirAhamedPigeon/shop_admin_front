import React, { useState, useRef, useEffect, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from "@/hooks/useTranslations";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";
import { useSelect } from "@/hooks/useSelect";
import { capitalize, labelFormatter } from "@/lib/helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type {  Path, PathValue, FieldError, UseFormSetValue, UseFormRegisterReturn} from "react-hook-form";
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { checkValueExists } from "@/lib/validations";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "../ui/textarea";
import { type DropzoneOptions, useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';

//Basic Input
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  type?: string;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  error?: FieldError;
  register: UseFormRegisterReturn;
  model: string;
}

export const BasicInput=({
    id,
    type='text',
    label,
    placeholder,
    isRequired = false,
    error,
    register,
    model,
    ...rest
  }: FormInputProps) => {
    const {t} = useTranslations();
  
    const getErrorMessage = () => {
      if (!error?.message) return null;
  
      const message = error.message.toString();
  
      // Try translating, fallback to raw message if not found
      return t(message, message);
    };
  
    return (
      <div className="w-full space-y-1 ">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {t(label, label)} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <Input type={type} id={id} placeholder={placeholder && t(placeholder, placeholder)} className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600" {...register} {...rest}/>
        {error && <p className="text-red-500 dark:text-red-400 text-sm">{getErrorMessage()}</p>}
      </div>
    );
}

//Unique Input
interface UniqueInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  type?: string
  label: string
  placeholder?: string
  isRequired?: boolean
  error?: FieldError
  register: UseFormRegisterReturn
  model: string
  field: string
  watchValue: string
  uniqueErrorMessage: string
  exceptFieldName?: string
  exceptFieldValue?: string
}

export const UniqueInput = ({
  id,
  type = "text",
  label,
  placeholder,
  isRequired = false,
  error,
  register,
  model,
  field,
  watchValue,
  uniqueErrorMessage,
  exceptFieldName,
  exceptFieldValue,
  ...rest
}: UniqueInputProps) => {
  const {t} = useTranslations()
  const [checking, setChecking] = useState(false)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    if (!watchValue || watchValue.length < 3) {
      setExists(false)
      return
    }

    const timer = setTimeout(async () => {
      setChecking(true)

      const found = await checkValueExists(
        model,
        field,
        watchValue,
        exceptFieldValue,
        exceptFieldName
      )

      setExists(found)
      setChecking(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [watchValue, model, field, exceptFieldName, exceptFieldValue])

  const getErrorMessage = () => {
    if (exists) {
      return t(uniqueErrorMessage, uniqueErrorMessage)
    }

    if (!error?.message) return null
    const message = error.message.toString()
    return t(message,  message )
  }

  return (
    <div className="space-y-1 w-full relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {t(label, label )}{" "}
        {isRequired && <span className="text-red-500">*</span>}
      </label>

      <Input
        type={type}
        id={id}
        placeholder={placeholder && t(placeholder,placeholder )}
        {...register}
        {...rest}
        className={cn(
        "bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600",
        exists && "border-red-500 dark:border-red-500",
        rest.className
      )}

      />

      {checking && (
        <div className="absolute right-3 top-9">
          <svg className="h-4 w-4 animate-spin text-gray-400 dark:text-gray-300" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" opacity="0.75" />
          </svg>
        </div>
      )}

      <AnimatePresence>
        {(exists || error) && (
          <motion.p
            className="text-red-500 dark:text-red-400 text-sm mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {getErrorMessage()}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// BasicTextarea

interface BasicTextareaProps {
  id: string;
  label: string;
  placeholder?: string;
  register: any;
  error?: any;
  rows?: number;
  isRequired?: boolean; 
}

export const BasicTextarea: React.FC<BasicTextareaProps> = ({
  id,
  label,
  placeholder,
  register,
  error,
  rows = 2,
  isRequired = false,
}) => {
  const {t} = useTranslations();
  return (
    <div className="space-y-1 w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {t(label)} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <Textarea
        id={id}
        placeholder={placeholder ? t(placeholder) : ""}
        rows={rows}
        {...register}
        className="w-full border border-gray-400 dark:border-slate-600 rounded-md p-2 text-sm bg-white dark:bg-slate-800 dark:text-white"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{t(error.message)}</p>
      )}
    </div>
  );
};

//Single Image Upload

type SingleImageInputProps = {
  label?: string;
  preview: string | null;
  onDrop: DropzoneOptions['onDrop'];
  error?: { message?: string };
  clearImage: () => void;
  disabled?: boolean;
  isRequired?: boolean;
  className?: string;
  minHeightClass?: string;
};

export const SingleImageInput: React.FC<SingleImageInputProps> = ({
  label = 'Upload Image',
  preview,
  onDrop,
  error,
  clearImage,
  disabled = false,
  isRequired = false,
  className,
  minHeightClass=''
}) => {
  const {t} = useTranslations()
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    },
    maxFiles: 1,
    disabled,
  });

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {t(label)} {isRequired && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border border-dashed border-gray-400 dark:border-slate-600 p-4 text-center rounded-md cursor-pointer bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex flex-col items-center justify-center",
          disabled && "bg-gray-100 dark:bg-slate-700 cursor-not-allowed opacity-70",minHeightClass
        )}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('Drag & drop or click to select an image')}</p>

        {preview && (
          <div className="mt-2 flex flex-col items-center justify-center gap-2">
            <img
              src={preview}
              alt="Preview"
              width={100}
              height={100}
              className="rounded-md border shadow dark:border-slate-600"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
            >
              {t('Remove Image')}
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error?.message && (
          <motion.p
            className="text-red-500 dark:text-red-400 text-sm mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {error.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelFallback?: string;
  error?: string;
  isHidden?: boolean;
  registerProps?: any;
  inputClassName?: string;
  isRequiredStar?: boolean;
  placeholder?: string;
  placeholderFallback?: string;
  showForgotPasswordLink?: boolean;
}

//DateTimeInput

type DateTimeProps = {
  id: string;
  label: string;
  name: string;
  value: Date | null;
  setValue: (field: string, value: any, options?: object) => void;
  placeholder?: string;
  isRequired?: boolean;
  showTime?: boolean;
  error?: any;
  disabled?: boolean;
  readOnly?: boolean;
  allowTyping?: boolean;
  showResetButton?: boolean;   // <-- new prop
  className?: string;
  model: string;
};

export interface CustomSelectProps<T extends Record<string, any>> {
  id: string;
  label: string;
  name: Path<T>;
  setValue: UseFormSetValue<T>;
  error?: FieldError | undefined | any;
  isRequired?: boolean;
  placeholder?: string;
  model: string;
  value?:
    | string
    | string[]
    | { value: string; label: string }
    | { value: string; label: string }[];
  multiple?: boolean;

  // 🔹 Static Options
  options?: { label: string; value: string }[];
  defaultOption?: { label: string; value: string };

  // 🔹 Dynamic/API Options
  apiUrl?: string;
  collection?: string;
  labelFields?: string[];
  valueFields?: string[];
  label_con_str?: string;
  value_con_str?: string;
  where?: Record<string, any>;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: Record<string, any>;
  optionValueKey?: string;
  optionLabelKeys?: string[];
  optionLabelSeparator?: string;
}

export function CustomSelect<T extends Record<string, any>>({
  id,
  label,
  name,
  collection,
  isRequired = false,
  placeholder = "Select option(s)",
  error,
  setValue,
  value,
  options = [],
  apiUrl,
  defaultOption,
  limit = 50,
  filter = {},
  optionValueKey = "_id",
  optionLabelKeys = ["name"],
  optionLabelSeparator = " ",
  multiple = false,
}: CustomSelectProps<T>) {
  const {t} = useTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    options: fetchedOptions,
    loading,
    selected,
    setSelected,
    getOptionLabel,
    setOptions,
  } = useSelect({
    collection,
    apiUrl,
    search,
    filter,
    limit,
    multiple,
    optionValueKey,
    optionLabelKeys,
    optionLabelSeparator,
    initialValue: value,
    isOpen:open
  });

  // 🔁 Ensure passed-in value objects are included in options
  useEffect(() => {
    if (!apiUrl || !value) return;
  
    const valArray = Array.isArray(value) ? value : [value];
    const valObjects: { value: string; label: string }[] = valArray.filter(
      (v): v is { value: string; label: string } =>
        typeof v === "object" && "value" in v && "label" in v
    );
  
    if (valObjects.length > 0) {
      setOptions((prev) => {
        const existingValues = new Set(prev.map((opt) => opt.value));
        const missing = valObjects.filter((vo) => !existingValues.has(vo.value));
  
        // Safely map to OptionType
        const normalized = missing.map((vo) => ({
          ...vo,
          label: vo.label,
          value: vo.value,
        }));
  
        return [...prev, ...normalized];
      });
    }
  }, [JSON.stringify(value), apiUrl]);

  // 🧠 Combine static + dynamic + passed value options
  const valueOptions = Array.isArray(value)
    ? value.filter((v) => typeof v === "object" && v?.value && v?.label)
    : typeof value === "object" && value?.value && value?.label
    ? [value]
    : [];

    const objectValueOptions = valueOptions.filter(
      (vo): vo is { value: string; label: string } =>
        typeof vo === 'object' && vo !== null && 'value' in vo && 'label' in vo
    );
    
    const allOptions = apiUrl
      ? [
          ...objectValueOptions,
          ...fetchedOptions.filter(
            (fo) => !objectValueOptions.some((vo) => vo.value === fo.value)
          ),
        ]
      : defaultOption
      ? [defaultOption, ...options]
      : options;

  // 🧱 Normalize selected value(s)
  const normalizedValue = multiple
    ? Array.isArray(value)
      ? value.map((v: any) => (typeof v === "string" ? v : v?.value))
      : value
      ? [typeof value === "string" ? value : value?.value]
      : []
    : typeof value === "string"
    ? value
    : (value as any)?.value || "";

  const getLabel = (val: string) =>
    allOptions.find((opt) => opt.value === val)?.label || '';

  const displayValue = multiple
    ? (normalizedValue as string[]).map((val) => labelFormatter(getLabel(val))).join(", ")
    : labelFormatter(getLabel(normalizedValue as string));

  const isSelected = (val: string) =>
    multiple
      ? (normalizedValue as string[]).includes(val)
      : normalizedValue === val;

    const handleChange = (val: string) => {
      if (multiple) {
        const prev = Array.isArray(normalizedValue) ? normalizedValue : [];
        const exists = prev.includes(val);
        const updated = exists ? prev.filter((v) => v !== val) : [...prev, val];
        setValue(name, updated as PathValue<T, typeof name>);
      } else {
        setValue(name, val as PathValue<T, typeof name>);
        setOpen(false);
      }
    };

  return (
    <div className="space-y-1 w-full">
      <label htmlFor={id}  className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {t(label, label)}{" "}
        {isRequired && <span className="text-red-500">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full bg-white dark:bg-slate-800">
            <Input
              readOnly
              ref={inputRef}
              className="text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 dark:text-white pr-10 border border-gray-500 dark:border-slate-600"
              value={displayValue}
              placeholder={t(placeholder, placeholder )}
              onClick={() => setOpen(true)}
            />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 w-4 h-4 pointer-events-none" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 mt-[-4px] w-full max-h-[300px] overflow-auto bg-white dark:bg-slate-800 border dark:border-slate-600"
          style={{ width: inputRef.current?.offsetWidth }}
        >
          <Command className="w-full bg-white dark:bg-slate-800">
            <CommandInput
              placeholder={t("Search","Search") + "..."}
              value={search}
              onValueChange={setSearch}
              className="w-full"
            />
            <CommandList>
              {loading && (
                <CommandItem key="loading" disabled>
                  {t("Loading", "Loading") + "..."}
                </CommandItem>
              )}
              {!loading &&
                allOptions.map((opt, i) => (
                  <CommandItem
                    key={opt.value || i}
                    onSelect={() => handleChange(opt.value)}
                    className={`cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 !rounded-none ${
                      isSelected(opt.value)
                        ? "!bg-blue-500 dark:!bg-slate-600 !text-white"
                        : "dark:text-gray-200"
                    }`}
                  >
                    {labelFormatter(opt.label)}
                  </CommandItem>
                ))}
              {!loading && allOptions.length === 0 && (
                <CommandItem key="no-options" disabled>
                  {t("No options found", "No options found.")}
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
}

export const PasswordInput = ({
  label,
  labelFallback,
  error,
  isHidden = true,
  registerProps,
  inputClassName,
  isRequiredStar,
  placeholder,
  placeholderFallback,
  showForgotPasswordLink = false,
  ...rest
}: PasswordInputProps) => {
  const [hidden, setHidden] = useState(isHidden);
  const { t } = useTranslations();
  const navigate = useNavigate();
  const theme = useSelector((state: RootState) => state.theme.current);

  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between items-center">
      <label
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {t(label, labelFallback)}{" "}
        {isRequiredStar && <span className="text-red-500">*</span>}
      </label>
      {showForgotPasswordLink && (
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
        >
          {t("common.forgotPassword", "Forgot Password?")}
        </button>
      )}
      </div>

      <div className="relative">
        <Input
          type={hidden ? "password" : "text"}
          className={cn(
            "pr-10 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600",
            inputClassName
          )}
          placeholder={placeholder && t(placeholder, placeholderFallback)}
          {...registerProps}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          className="absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-400"
        >
          {hidden ? (
            <Eye className="h-4 w-4 cursor-pointer" />
          ) : (
            <EyeOff className="h-4 w-4 cursor-pointer" />
          )}
        </button>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
    </div>
  );
};

const DateTimeInput = React.forwardRef<React.ComponentRef<typeof DatePicker>, DateTimeProps>(
  (
    {
      id,
      label,
      name,
      value,
      setValue,
      placeholder,
      isRequired,
      showTime = false,
      error,
      disabled,
      readOnly,
      allowTyping = false,
      showResetButton = false, // default off
      className
      },
    ref
  ) => {
    const {t} = useTranslations();

    const handleReset = (e: React.MouseEvent) => {
      e.stopPropagation(); // prevent popover toggle if any
      setValue(name, '');
    };

    return (
      <div className="w-full space-y-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-white">
          {t(label, label)} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <DatePicker
            id={id}
            selected={value}
            onChange={(date) => setValue(name, date)}
            showTimeSelect={showTime}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={200}
            timeFormat={showTime ? "HH:mm" : undefined}
            timeIntervals={showTime ? 15 : undefined}
            dateFormat={showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
            placeholderText={placeholder || (showTime ? "Select date & time" : "Select date")}
            ref={ref}
            readOnly={readOnly}
            disabled={disabled}
            popperProps={{
                strategy: "fixed",
              }}
             popperContainer={({ children }) => (
              <div style={{ zIndex: 999999 }}>{children}</div>
            )}
            wrapperClassName="w-full"
            portalId="datepicker-portal"
            popperPlacement="bottom-start"
            showPopperArrow
            popperClassName="z-[9999] overflow-hidden"
            className={cn(
              "w-full border border-gray-400 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg h-[38px] px-3 py-2 text-sm placeholder:text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400",
              error && "border-red-500 dark:border-red-500",
              className
            )}
          />

          {showResetButton && value && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Clear date"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-red-400"
              tabIndex={-1} // exclude from tab order, optional
            >
              <span className="text-xs text-gray-800 hover:text-red-700 cursor-pointer hover:font-bold dark:text-white dark:hover:text-red-700">&#10005;</span> {/* or use an SVG icon for 'X' */}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

DateTimeInput.displayName = 'DateTimeInput';
export default DateTimeInput;