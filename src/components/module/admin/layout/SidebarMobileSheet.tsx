// src/components/module/admin/layout/SidebarMobileSheet.tsx
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Brand } from './Header'
import { SidebarBody } from './Sidebar'

/** The sidebar as a slide-over on screens narrower than lg. */
export default function SidebarMobileSheet() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="header-icon-btn lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="dark app-sidebar w-[280px] gap-0 overflow-hidden border-r-0 p-0 flex flex-col text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Main menu</SheetDescription>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-[18px]">
          <Brand />
          <SheetClose asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          </SheetClose>
        </div>
        <SidebarBody onNavigate={close} layoutGroup="sheet" />
      </SheetContent>
    </Sheet>
  )
}
