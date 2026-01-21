import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from "@/hooks/useTranslations";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";
import { useSelect } from "@/hooks/useSelect";
import { capitalize } from "@/lib/helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type {  Path, PathValue, FieldError, UseFormSetValue} from "react-hook-form";
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'


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
  error?: FieldError;
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
    ? (normalizedValue as string[]).map((val) => capitalize(getLabel(val))).join(", ")
    : capitalize(getLabel(normalizedValue as string));

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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-white">
        {t(label, label)}{" "}
        {isRequired && <span className="text-red-500">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full bg-white dark:bg-[#2a405a]">
            <Input
              readOnly
              ref={inputRef}
              className="text-left cursor-pointer hover:bg-slate-100 dark:text-white pr-10 border border-gray-500 dark:border-[#4a607a]"
              value={displayValue}
              placeholder={t(placeholder, placeholder )}
              onClick={() => setOpen(true)}
            />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white w-4 h-4 pointer-events-none" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 mt-[-4px] w-full max-h-[300px] overflow-auto"
          style={{ width: inputRef.current?.offsetWidth }}
        >
          <Command className="w-full">
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
                    className={`cursor-pointer hover:bg-blue-100 dark:hover:bg-[#4a607a80] !rounded-none ${
                      isSelected(opt.value)
                        ? "!bg-blue-400 hover:!bg-blue-400 dark:!bg-[#4a607a] dark:hover:!bg-[#4a607a] !text-white dark:text-white"
                        : ""
                    }`}
                  >
                    {capitalize(opt.label)}
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
        className={cn(
          "block text-sm font-medium",
          theme === "dark" ? "text-gray-200 dark:text-white" : "text-gray-700 dark:text-white"
        )}
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
          className={cn("pr-10", inputClassName)}
          placeholder={placeholder && t(placeholder, placeholderFallback)}
          {...registerProps}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          className={cn(
            "absolute inset-y-0 right-2 flex items-center",
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          )}
        >
          {hidden ? (
            <Eye className="h-4 w-4 cursor-pointer" />
          ) : (
            <EyeOff className="h-4 w-4 cursor-pointer" />
          )}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
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
              "w-full border border-gray-400 rounded-lg h-[38px] px-3 py-2",
              error && "border-red-500",
              className
            )}
          />

          {showResetButton && value && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Clear date"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white dark:hover:text-red-700"
              tabIndex={-1} // exclude from tab order, optional
            >
              <span className="text-xs text-gray-800 hover:text-red-700 cursor-pointer hover:font-bold dark:text-white dark:hover:text-red-700">&#10005;</span> {/* or use an SVG icon for 'X' */}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error.message}</p>}
      </div>
    );
  }
);

DateTimeInput.displayName = 'DateTimeInput';
export default DateTimeInput;