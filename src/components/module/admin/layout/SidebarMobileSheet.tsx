'use client'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import Nav from './Nav'
import LanguageSwitcher from '@/components/custom/LanguageSwitcher'
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton'
import { useAppSelector } from '@/hooks/useRedux'
import { cn } from '@/lib/utils'

export default function SidebarMobileSheet() {
  const [open, setOpen] = useState(false)
  const { current: theme } = useAppSelector((state) => state.theme)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          "p-0 [&>button.sheet-close span]:hidden",
          theme === "dark" ? "secondary-gradient-dark" : "secondary-gradient"
        )}
      >
        <SheetHeader className="flex items-start justify-center main-gradient py-2 px-4">
          <SheetTitle>
            <Logo isTitle={true} className="" titleClassName="text-white" />
          </SheetTitle>
          <SheetClose asChild>
            <button className="absolute top-4 right-4 text-white hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </SheetClose>
        </SheetHeader>
        <div className="p-4">
          <div className='flex flex-row justify-start items-center'>
            <LanguageSwitcher/>
            <ThemeToggleButton/>
          </div>
          <Nav onLinkClick={() => setOpen(false)}/>
        </div>
      </SheetContent>
    </Sheet>
  )
}
