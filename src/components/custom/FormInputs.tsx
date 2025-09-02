// import React, {
//   useEffect,
//   useState,
//   useRef,
//   InputHTMLAttributes,
// } from "react";
// import { Input } from "@/components/ui/input";
// import {
//   Path,
//   PathValue,
//   FieldError,
//   UseFormRegisterReturn,
//   UseFormSetValue,
// } from "react-hook-form";
// import { AnimatePresence, motion } from "framer-motion";
// import { checkValueExists } from "@/lib/validations";
// import { cn } from "@/lib/utils";
// import { ChevronDown, Eye, EyeOff } from "lucide-react";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import { useSelect } from "@/hooks/useSelect";
// import { capitalize } from "@/lib/helpers";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useDropzone, DropzoneOptions } from "react-dropzone";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { useTranslations } from "../hooks/useTranslations";
// // 
// /* ------------------------------------------------
//    ✅ Password Input
// ------------------------------------------------ */
// interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
//   label: string;
//   error?: string;
//   isHidden?: boolean;
//   registerProps?: any;
//   inputClassName?: string;
//   isRequiredStar?: boolean;
//   placeholder?: string;
//   model: string;
// }

// export const PasswordInput = ({
//   label,
//   error,
//   isHidden = true,
//   registerProps,
//   inputClassName,
//   isRequiredStar,
//   placeholder,
//   model,
//   ...rest
// }: PasswordInputProps) => {
//   const [hidden, setHidden] = useState(isHidden);
//   const t = useTranslations();
//   return (
//     <div className="space-y-1 w-full">
//       <label className="block text-sm font-medium text-gray-700">
//         {t(label)} {isRequiredStar && <span className="text-red-500">*</span>}
//       </label>
//       <div className="relative">
//         <Input
//           type={hidden ? "password" : "text"}
//           className={cn(inputClassName, "pr-10 bg-white")}
//           placeholder={placeholder && t(placeholder)}
//           {...registerProps}
//           {...rest}
//         />
//         <button
//           type="button"
//           onClick={() => setHidden(!hidden)}
//           className="absolute inset-y-0 right-2 flex items-center text-gray-500"
//         >
//           {hidden ? (
//             <Eye className="h-4 w-4 cursor-pointer" />
//           ) : (
//             <EyeOff className="h-4 w-4 cursor-pointer" />
//           )}
//         </button>
//       </div>
//       {error && <p className="text-red-500 text-sm">{error}</p>}
//     </div>
//   );
// };
