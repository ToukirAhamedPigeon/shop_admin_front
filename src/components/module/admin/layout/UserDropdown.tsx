"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp } from "lucide-react";
import LogoutButton from "@/components/custom/LogoutButton";
import { useState } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { capitalize } from "@/lib/helpers";
import { useTranslations } from "@/hooks/useTranslations";

export default function UserDropdown() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <div className="flex items-center gap-2">
          <Avatar className="cursor-pointer">
            <AvatarImage src={user.image || "/human.png"} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <h3 className="hidden lg:block text-white">{user.name?.split(" ")[0] ?? ""}</h3>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-white" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white" />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2 space-y-2 
        bg-[radial-gradient(circle_at_bottom_left,_#FFFFFF,_#faf6e2)] 
        dark:bg-[radial-gradient(circle_at_bottom_left,_#1b2a3f,_#0f1a2a)] 
        border border-gray-200 dark:border-gray-700
        shadow-lg dark:shadow-black/40
        rounded-lg
      ">
        {/* Top Section */}
        <div className="flex flex-col items-center text-center gap-1 px-2 py-3">
          <Avatar className="w-14 h-14 mb-2">
            <AvatarImage src={user.image || "/human.png"} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
          <div className="text-xs text-muted-foreground dark:text-gray-300">{user.email}</div>
          {user.roles && user.roles.length > 0 && (
            <div className="text-xs font-medium capitalize text-gray-700 dark:text-gray-400">
              {capitalize(user.roles.join(", "))}
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="border-gray-300 dark:border-gray-600" />

        {/* Footer - Logout */}
        <DropdownMenuItem
          className="text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          onSelect={(e) => e.preventDefault()}
        >
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
