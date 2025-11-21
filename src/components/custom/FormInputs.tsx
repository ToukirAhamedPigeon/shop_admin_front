import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";

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
          theme === "dark" ? "text-gray-200" : "text-gray-700"
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