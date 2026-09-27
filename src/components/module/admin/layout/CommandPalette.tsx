// src/components/module/admin/layout/CommandPalette.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, CornerDownLeft, Languages, LogOut, Moon, Search, Sun } from 'lucide-react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/redux/store'
import { toggleTheme } from '@/redux/slices/themeSlice'
import { fetchTranslations, setLanguage } from '@/redux/slices/languageSlice'
import { useAppSelector } from '@/hooks/useRedux'
import { useTranslations } from '@/hooks/useTranslations'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { visibleMenu } from './menu'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Search box in the header; opens a palette to jump to any page (Ctrl/⌘ + K). */
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { t, currentLang } = useTranslations()
  const theme = useAppSelector((s) => s.theme.current)
  const permissions = useAppSelector((s) => (s.auth.user?.permissions as string[] | undefined) ?? [])
  const sections = visibleMenu(permissions)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  const nextLang = currentLang === 'en' ? 'bn' : 'en'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('common.search', 'Search')}
        className="header-icon-btn md:w-72 md:justify-start md:gap-2.5 md:border md:border-border md:bg-muted/50 md:px-3 md:text-sm md:hover:bg-muted"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden md:inline">{t('common.searchPages', 'Search pages…')}</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-card px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground md:inline">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="top-[20%] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-xl">
          <DialogTitle className="sr-only">{t('common.searchPages', 'Search pages')}</DialogTitle>
          <DialogDescription className="sr-only">{t('common.searchHint', 'Type to find a page or action')}</DialogDescription>
          <Command className="[&_[cmdk-input-wrapper]]:h-14 [&_[cmdk-input-wrapper]]:px-4 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:px-2.5 [&_[cmdk-item]]:py-2">
            <CommandInput placeholder={t('common.searchPlaceholder', 'Where do you want to go?')} className="h-14 text-[15px]" />
            <CommandList className="max-h-[min(60vh,420px)] p-1.5">
              <CommandEmpty>{t('common.noResults', 'No results found.')}</CommandEmpty>

              {sections.map((section) => {
                const pages = section.children ?? [section]
                return (
                  <CommandGroup key={section.label} heading={t(section.label, section.defaultLabel)}>
                    {pages.map((page) => {
                      const Icon = page.icon
                      const label = t(page.label, page.defaultLabel)
                      return (
                        <CommandItem
                          key={page.label}
                          // Section name in the value so "settings users" finds Users.
                          value={`${label} ${t(section.label, section.defaultLabel)} ${page.basePath}`}
                          onSelect={() =>
                            run(() =>
                              page.external ? window.open(page.basePath, '_blank', 'noopener,noreferrer') : navigate(page.basePath)
                            )
                          }
                        >
                          <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                            <Icon />
                          </span>
                          <span className="truncate">{label}</span>
                          {page.external && <ArrowUpRight className="ml-auto opacity-50" />}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )
              })}

              <CommandSeparator className="my-1" />
              <CommandGroup heading={t('common.actions', 'Actions')}>
                <CommandItem value="toggle theme dark light mode" onSelect={() => run(() => dispatch(toggleTheme()))}>
                  <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                    {theme === 'dark' ? <Sun /> : <Moon />}
                  </span>
                  {theme === 'dark' ? t('common.lightMode', 'Switch to light mode') : t('common.darkMode', 'Switch to dark mode')}
                </CommandItem>
                <CommandItem
                  value="language bangla english switch"
                  onSelect={() =>
                    run(() => {
                      localStorage.setItem('lang', nextLang)
                      dispatch(setLanguage(nextLang))
                      dispatch(fetchTranslations({ lang: nextLang, forceFetch: true }))
                    })
                  }
                >
                  <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                    <Languages />
                  </span>
                  {nextLang === 'bn' ? 'বাংলায় দেখুন' : 'Switch to English'}
                  <CommandShortcut>{nextLang.toUpperCase()}</CommandShortcut>
                </CommandItem>
                {permissions.includes('logout-admin-auth') && (
                  <CommandItem value="logout sign out" onSelect={() => run(() => window.dispatchEvent(new CustomEvent('logout')))}>
                    <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-destructive">
                      <LogOut />
                    </span>
                    {t('common.logout', 'Logout')}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
            <div className="flex items-center gap-4 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-card px-1 font-sans">↑</kbd>
                <kbd className="rounded border border-border bg-card px-1 font-sans">↓</kbd>
                {t('common.navigate', 'to navigate')}
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-card px-1"><CornerDownLeft className="size-3" /></kbd>
                {t('common.open', 'to open')}
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-card px-1 font-sans">Esc</kbd>
                {t('common.close', 'to close')}
              </span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
