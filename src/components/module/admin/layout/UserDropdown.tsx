'use client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { ChevronDown, ChevronUp, LogOut } from 'lucide-react'
  import LogoutButton from '@/components/custom/LogoutButton'
  import { useState } from 'react'
  import { useAppSelector } from '@/hooks/useRedux';
  import { capitalize } from '@/lib/helpers'
  import { useTranslations } from 'next-intl';

  export default function UserDropdown() {
    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false)
    const user = useAppSelector((state) => state.authUser);
    const roles = useAppSelector((state) => state.roles);
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild className="cursor-pointer">
          <div className="flex items-center gap-2">
            <Avatar className="cursor-pointer">
              <AvatarImage src={user?.image || '/policeman.png'} alt={user.name || 'Police Man'} />
              <AvatarFallback>{user.name?.charAt(0) ?? '?'}</AvatarFallback>
            </Avatar>
            <h3 className='hidden lg:block text-white'>{user.name?.split(' ')[0] ?? ''}</h3>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </DropdownMenuTrigger>
  
        <DropdownMenuContent className="w-64 p-2 space-y-2 bg-[radial-gradient(circle_at_bottom_left,_#FFFFFF,_#faf6e2)]">
          {/* Top Section */}
          <div className="flex flex-col items-center text-center gap-1 px-2 py-3">
            <Avatar className="w-14 h-14 mb-2">
              <AvatarImage src={user.image || '/policeman.png'} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
            <div className="text-xs font-medium capitalize">{capitalize(roles.join(', '))}</div>
          </div>
  
          <DropdownMenuSeparator />
  
          {/* Footer - Logout */}
          <DropdownMenuItem className="text-red-500 font-medium">
            <LogoutButton variant="default" className="w-full bg-red-500 hover:bg-red-600">
              <LogOut className="w-4 h-4 mr-2 text-white" />
              {t('Logout')}
            </LogoutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }