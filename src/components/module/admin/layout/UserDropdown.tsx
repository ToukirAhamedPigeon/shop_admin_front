"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, User, Settings, KeyRound, LogOut, Shield, Mail, Lock } from "lucide-react";
import LogoutButton from "@/modules/auth/components/LogoutButton";
import { useState } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { capitalize } from "@/lib/helpers";
import { useTranslations } from "@/hooks/useTranslations";
import { Link } from "react-router-dom";

export default function UserDropdown() {
  const {t} = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user.name) return "U";
    return user.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button 
          className="
            cursor-pointer flex items-center gap-2 px-2 py-1.5 
            rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/50 
            transition-all duration-200 focus:outline-none focus:ring-2 
            focus:ring-blue-500/50 group
          "
        >
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-blue-400/50 transition-all">
            <AvatarImage 
              src={user?.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined} 
              alt={user.name} 
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-sm font-medium text-white leading-tight">
              {user.name?.split(" ")[0] ?? "User"}
            </span>
            <span className="text-xs text-white/70 leading-tight">
              {user.roles?.[0] ? capitalize(user.roles[0]) : "User"}
            </span>
          </div>
          
          <div className="text-white/80 group-hover:text-white transition-colors">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          w-[280px] sm:w-72 p-1
          bg-white/95 dark:bg-gray-900/95 
          backdrop-blur-md backdrop-saturate-150
          border border-gray-200/50 dark:border-gray-700/50
          shadow-xl shadow-black/5 dark:shadow-black/40
          rounded-xl
          transition-all duration-200
          animate-in fade-in-0 zoom-in-95
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
        "
      >
        {/* User Info Card */}
        <div className="relative px-3 py-4 mb-1">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl -z-10" />
          
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-gray-800 shadow-md">
              <AvatarImage 
                src={user?.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined} 
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user.name}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              
              {/* Roles & Permissions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.roles && user.roles.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    {user.roles.length === 1 ? capitalize(user.roles[0]) : `${user.roles.length} Roles`}
                  </span>
                )}
                {user.permissions && user.permissions.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                    <KeyRound className="w-3 h-3" />
                    {user.permissions.length} Permissions
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-gray-700" />

        {/* Menu Items */}
        <div className="py-1">
          <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-800 rounded-lg cursor-pointer">
            <Link to="/settings/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {t("common.profile.title", "Profile")}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Manage your personal information
                </span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-800 rounded-lg cursor-pointer">
            <Link to="/settings/app" className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {t("common.app.title", "Application")}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  App preferences and settings
                </span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-800 rounded-lg cursor-pointer">
            <Link to="/settings/change-password" className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {t("common.changePassword.title", "Change Password")}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Update your password
                </span>
              </div>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-gray-700" />

        {/* Logout Section */}
        <div className="py-1">
          <DropdownMenuItem 
            className="focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg cursor-pointer p-0"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="w-full">
              <LogoutButton />
            </div>
          </DropdownMenuItem>
        </div>

        {/* Footer Note */}
        <div className="px-3 py-2 mt-1">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Signed in as <span className="font-medium text-gray-700 dark:text-gray-300">{user.username || user.email}</span>
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}