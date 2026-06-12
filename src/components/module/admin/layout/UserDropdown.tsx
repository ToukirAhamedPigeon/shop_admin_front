"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, User, Settings, KeyRound, Shield, Mail, Lock, SlidersHorizontal } from "lucide-react";
import LogoutButton from "@/modules/auth/components/LogoutButton";
import { useState } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { capitalize, truncateText } from "@/lib/helpers";
import { useTranslations } from "@/hooks/useTranslations";
import { Link } from "react-router-dom";
import { Can } from "@/components/custom/Can";

export default function UserDropdown() {
  const {t} = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  const getInitials = () => {
    if (!user.name) return "U";
    return user.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getDisplayName = () => {
    if (user.name && user.name.trim()) return user.name;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };

  const displayName = getDisplayName();
  const truncatedName = capitalize(truncateText(displayName, 20));
  const firstName = displayName.split(" ")[0];
  const truncatedFirstName = capitalize(truncateText(firstName, 15));

  // Get gradient for user name based on name length/characters
  const getNameGradient = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400",
      "from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400",
      "from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400",
      "from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400",
      "from-rose-600 to-red-600 dark:from-rose-400 dark:to-red-400",
      "from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400",
    ];
    return gradients[hash % gradients.length];
  };

  // Get gradient for role
  const getRoleGradient = (role: string) => {
    const roleHash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const roleGradients = [
      "from-emerald-500 to-teal-500",
      "from-violet-500 to-purple-500",
      "from-amber-500 to-orange-500",
      "from-rose-500 to-pink-500",
      "from-sky-500 to-blue-500",
    ];
    return roleGradients[roleHash % roleGradients.length];
  };

  const userRole = user.roles?.[0] ? capitalize(user.roles[0]) : "User";
  const nameGradient = getNameGradient(truncatedFirstName);
  const roleGradient = getRoleGradient(userRole);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button 
          className={`cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 group ${
            isDarkMode 
              ? 'hover:bg-white/10' 
              : 'hover:bg-black/5'
          }`}
        >
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-blue-400/50 transition-all">
            <AvatarImage 
              src={user?.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined} 
              alt={displayName} 
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="hidden lg:flex flex-col items-start">
            <span className={`text-sm font-bold bg-gradient-to-r ${nameGradient} bg-clip-text text-transparent`} title={displayName}>
              {truncatedFirstName}
            </span>
            <span className={`text-xs font-medium bg-gradient-to-r ${roleGradient} bg-clip-text text-transparent`}>
              {userRole}
            </span>
          </div>
          
          <div className={`transition-colors ${isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-800'}`}>
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
        className={`
          w-[280px] sm:w-72 p-1
          backdrop-blur-xl backdrop-saturate-150
          border rounded-xl
          transition-all duration-200
          animate-in fade-in-0 zoom-in-95
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
          ${isDarkMode 
            ? 'bg-gray-900/60 border-gray-700/50 shadow-xl shadow-black/40' 
            : 'bg-white/60 border-white/40 shadow-xl shadow-black/5'
          }
        `}
      >
        {/* User Info Card */}
        <div className="relative px-3 py-4 mb-1">
          <div className={`absolute inset-0 rounded-xl -z-10 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-900/50' 
              : 'bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50'
          }`} />
          
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-white/50 dark:ring-gray-700/50 shadow-md">
              <AvatarImage 
                src={user?.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined} 
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold truncate bg-gradient-to-r ${nameGradient} bg-clip-text text-transparent`} title={displayName}>
                {truncatedName}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.roles && user.roles.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium backdrop-blur-sm">
                    <Shield className="w-3 h-3" />
                    {user.roles.length === 1 ? capitalize(user.roles[0]) : `${user.roles.length} Roles`}
                  </span>
                )}
                {user.permissions && user.permissions.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100/70 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium backdrop-blur-sm">
                    <KeyRound className="w-3 h-3" />
                    {user.permissions.length} Permissions
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className={`my-1 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`} />

        <div className="py-1">
          <Can anyOf={['read-admin-profile','update-admin-profile']}>
            <DropdownMenuItem asChild className={`${isDarkMode ? 'focus:bg-gray-800/50' : 'focus:bg-gray-100/50'} rounded-lg cursor-pointer backdrop-blur-sm`}>
              <Link to="/settings/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
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
          </Can>
          
          <Can anyOf={['read-admin-settings']}>
            <DropdownMenuItem asChild className={`${isDarkMode ? 'focus:bg-gray-800/50' : 'focus:bg-gray-100/50'} rounded-lg cursor-pointer backdrop-blur-sm`}>
              <Link to="/settings/app" className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {t("common.app.title", "App Settings")}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    App preferences and settings
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>
          </Can>
          
          <Can anyOf={['change-admin-password']}>
            <DropdownMenuItem asChild className={`${isDarkMode ? 'focus:bg-gray-800/50' : 'focus:bg-gray-100/50'} rounded-lg cursor-pointer backdrop-blur-sm`}>
              <Link to="/settings/change-password" className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
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
          </Can>
        </div>

        <DropdownMenuSeparator className={`my-1 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`} />

        <Can anyOf={['logout-admin-auth','logout-all-admin-auth','logout-others-admin-auth']}>
          <div className="py-1">
            <DropdownMenuItem 
              className={`${isDarkMode ? 'focus:bg-red-900/20' : 'focus:bg-red-50/50'} rounded-lg cursor-pointer p-0 backdrop-blur-sm`}
              onSelect={(e) => e.preventDefault()}
            >
              <div className="w-full">
                <LogoutButton />
              </div>
            </DropdownMenuItem>
          </div>
        </Can>

        <div className="px-3 py-2 mt-1">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Signed in as <span className={`font-bold bg-gradient-to-r ${nameGradient} bg-clip-text text-transparent`}>{truncatedName}</span>
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}