"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, User, KeyRound, Shield, Mail, Lock, SlidersHorizontal } from "lucide-react";
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

  const userRole = user.roles?.[0] ? capitalize(user.roles[0]) : "User";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring group hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="hidden lg:flex flex-col items-start">
            <span className="text-sm font-bold text-foreground" title={displayName}>
              {truncatedFirstName}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {userRole}
            </span>
          </div>

          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
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
        className="w-[280px] sm:w-72 p-1 border border-border rounded-xl bg-popover shadow-md"
      >
        {/* User Info Card */}
        <div className="px-3 py-4 mb-1">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 shadow-sm">
              <AvatarImage
                src={user?.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold truncate text-foreground" title={displayName}>
                {truncatedName}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.roles && user.roles.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    {user.roles.length === 1 ? capitalize(user.roles[0]) : `${user.roles.length} Roles`}
                  </span>
                )}
                {user.permissions && user.permissions.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                    <KeyRound className="w-3 h-3" />
                    {user.permissions.length} Permissions
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <div className="py-1">
          <Can anyOf={['read-admin-profile','update-admin-profile']}>
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
              <Link to="/settings/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {t("common.profile.title", "Profile")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Manage your personal information
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>
          </Can>

          <Can anyOf={['read-admin-settings']}>
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
              <Link to="/settings/app" className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {t("common.app.title", "App Settings")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    App preferences and settings
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>
          </Can>

          <Can anyOf={['change-admin-password']}>
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
              <Link to="/settings/change-password" className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {t("common.changePassword.title", "Change Password")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Update your password
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>
          </Can>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <Can anyOf={['logout-admin-auth','logout-all-admin-auth','logout-others-admin-auth']}>
          <div className="py-1">
            <DropdownMenuItem
              className="focus:bg-destructive/10 rounded-lg cursor-pointer p-0"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="w-full">
                <LogoutButton />
              </div>
            </DropdownMenuItem>
          </div>
        </Can>

        <div className="px-3 py-2 mt-1">
          <p className="text-xs text-center text-muted-foreground">
            Signed in as <span className="font-bold text-foreground">{truncatedName}</span>
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}