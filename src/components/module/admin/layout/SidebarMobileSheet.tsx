'use client'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import Nav from './Nav'
import LanguageSwitcher from '@/components/custom/LanguageSwitcher'

export default function SidebarMobileSheet() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 secondary-gradient [&>button.sheet-close span]:hidden">
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
          <div className='flex flex-row justify-between'>
            <LanguageSwitcher/>
          </div>
          <Nav onLinkClick={() => setOpen(false)}/>
        </div>
      </SheetContent>
    </Sheet>
  )
}
