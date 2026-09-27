// src/components/module/admin/layout/Nav.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector } from "@/hooks/useRedux";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { activePath, visibleMenu, type MenuItem } from "./menu";

const EASE = [0.22, 1, 0.36, 1] as const;

const rowBase =
  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const rowIdle = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

/**
 * Sidebar navigation. `collapsed` renders the icon rail: leaves become icon
 * links with a hover label, and parents open their children in a flyout.
 * `layoutGroup` keeps the sliding highlight separate per instance (desktop vs
 * mobile sheet).
 */
export default function Nav({
  onLinkClick,
  collapsed = false,
  layoutGroup = "nav",
}: {
  onLinkClick?: () => void;
  collapsed?: boolean;
  layoutGroup?: string;
}) {
  const { pathname } = useLocation();
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion();
  const permissions = useAppSelector((s) => (s.auth.user?.permissions as string[] | undefined) ?? []);
  const items = visibleMenu(permissions);
  const active = activePath(pathname, items);
  const [closed, setClosed] = useState<string[]>([]);
  const [opened, setOpened] = useState<string[]>([]);

  const containsActive = (item: MenuItem) => !!item.children?.some((c) => c.basePath === active);
  // Groups holding the current page start open; the user can still fold them.
  const isOpen = (item: MenuItem) =>
    containsActive(item) ? !closed.includes(item.label) : opened.includes(item.label);
  const toggle = (item: MenuItem) => {
    const flip = (list: string[]) =>
      list.includes(item.label) ? list.filter((l) => l !== item.label) : [...list, item.label];
    if (containsActive(item)) setClosed(flip);
    else setOpened(flip);
  };

  // The active row's background slides between rows instead of jumping.
  const highlight = (
    <motion.span
      layoutId={`${layoutGroup}-active`}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: EASE }}
      className="nav-active absolute inset-0 rounded-lg"
      aria-hidden
    />
  );

  const leaf = (item: MenuItem, nested: boolean) => {
    const Icon = item.icon;
    const isActive = item.basePath === active;
    const label = t(item.label, item.defaultLabel);
    const content = (
      <>
        {isActive && highlight}
        <Icon
          className={cn(
            "relative shrink-0 transition-colors duration-150",
            nested ? "size-4" : "size-[18px]",
            isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
          )}
          strokeWidth={1.75}
        />
        <span className={cn("relative truncate", collapsed && "sr-only")}>{label}</span>
        {item.external && !collapsed && <ArrowUpRight className="relative ml-auto size-3.5 opacity-50" />}
        {collapsed && <span className="nav-tip">{label}</span>}
      </>
    );
    const cls = cn(
      rowBase,
      collapsed && "justify-center px-0",
      isActive ? "font-medium text-sidebar-primary-foreground" : rowIdle
    );
    return item.external ? (
      <a key={item.label} href={item.basePath} target="_blank" rel="noopener noreferrer" onClick={onLinkClick} className={cls}>
        {content}
      </a>
    ) : (
      <Link key={item.label} to={item.basePath} onClick={onLinkClick} className={cls} aria-current={isActive ? "page" : undefined}>
        {content}
      </Link>
    );
  };

  const flyout = (item: MenuItem) => {
    const Icon = item.icon;
    const hasActive = containsActive(item);
    const label = t(item.label, item.defaultLabel);
    return (
      <DropdownMenu key={item.label} modal={false}>
        <DropdownMenuTrigger
          className={cn(
            rowBase,
            "justify-center px-0 cursor-pointer",
            hasActive ? "text-sidebar-primary-foreground" : rowIdle
          )}
        >
          {hasActive && highlight}
          <Icon
            className={cn("relative size-[18px]", hasActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground")}
            strokeWidth={1.75}
          />
          <span className="sr-only">{label}</span>
          <span className="nav-tip">{label}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={14} className="w-56 rounded-xl p-1.5">
          <DropdownMenuLabel className="px-2 text-xs font-medium text-muted-foreground">{label}</DropdownMenuLabel>
          {item.children!.map((child) => {
            const ChildIcon = child.icon;
            const isActive = child.basePath === active;
            const inner = (
              <>
                <ChildIcon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
                <span className="truncate">{t(child.label, child.defaultLabel)}</span>
                {child.external && <ArrowUpRight className="ml-auto size-3.5 opacity-50" />}
              </>
            );
            return (
              <DropdownMenuItem key={child.label} asChild className={cn("cursor-pointer gap-2.5 rounded-lg", isActive && "bg-primary/10 font-medium text-primary")}>
                {child.external ? (
                  <a href={child.basePath} target="_blank" rel="noopener noreferrer">{inner}</a>
                ) : (
                  <Link to={child.basePath} onClick={onLinkClick}>{inner}</Link>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const group = (item: MenuItem) => {
    const Icon = item.icon;
    const open = isOpen(item);
    const hasActive = containsActive(item);
    return (
      <div key={item.label}>
        <button
          type="button"
          onClick={() => toggle(item)}
          aria-expanded={open}
          className={cn(rowBase, "cursor-pointer", hasActive ? "font-medium text-sidebar-accent-foreground" : rowIdle)}
        >
          <Icon
            className={cn("size-[18px] shrink-0", hasActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground")}
            strokeWidth={1.75}
          />
          <span className="truncate">{t(item.label, item.defaultLabel)}</span>
          <ChevronDown
            className={cn("ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200", open && "rotate-180")}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="ml-[21px] mt-0.5 space-y-0.5 border-l border-sidebar-border py-0.5 pl-2.5">
                {item.children!.map((child) => leaf(child, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <nav aria-label="Main" className="space-y-0.5 px-3 py-4">
      {items.map((item) =>
        item.children ? (collapsed ? flyout(item) : group(item)) : leaf(item, false)
      )}
    </nav>
  );
}
