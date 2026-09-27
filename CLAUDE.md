# shop_admin_front

React 19 + Vite 7 + TypeScript admin panel (Tailwind v4, shadcn/ui, Redux Toolkit).

## Workflow

- The default branch is `master` (there is no `main`).
- Merge completed PRs into `master` once `npm run build` passes. The owner
  does not need to be asked first.

## Commands

- `npm run dev`: dev server. API calls go to `${VITE_API_BASE_URL}/api`.
- `npm run build`: runs `tsc -b`, then `vite build`. Both must pass before merging.
- `npm run lint`: ESLint. The codebase has existing warnings, so don't add new ones.

## TypeScript

- `noUnusedLocals` and `noUnusedParameters` are on. Unused imports or variables fail the build.
- Type libraries are explicit: `tsconfig.app.json` uses `vite/client`, and
  `tsconfig.node.json` (for `vite.config.ts`) uses `node`. Don't use Node
  globals such as `NodeJS.Timeout` in `src`; use `ReturnType<typeof setTimeout>`.

## Styling

- Colors, radii and shadows are CSS variables in `src/index.css` (`:root` and
  `.dark`). Use token classes (`bg-card`, `text-muted-foreground`,
  `border-border`, `bg-primary`, `text-success`/`warning`/`info`/`destructive`)
  instead of raw palette classes like `text-gray-500` or `bg-blue-500`.
- Keep motion short and subtle (fades or small slides, about 150–300 ms,
  ease-out). No springs, bounces or hover scaling.
- Exception: the public pages (login, forgot/reset password, verify email,
  403 and 404) are intentionally richer, at the owner's request. They all
  render inside `AuthShell` (`src/modules/auth/components/AuthShell.tsx`), a
  layout route, so the scene persists while moving between them. Build new
  public pages from `AuthKit.tsx` (card, fields, status, error code) rather
  than restyling from scratch. The shell has a full-screen Three.js
  neural-network sphere (`NeuralScene`), progressive frosted glass behind the
  form, a GSAP headline reveal and Aceternity-style effects
  (`src/components/aceternity/`). Three.js must stay lazy-loaded (desktop only,
  `NeuralScene` chunk), and every effect must respect `prefers-reduced-motion`.
  The glass drops its backdrop blur on mobile, on low-power devices, and when
  the measured frame rate falls below 40 fps. Keep that fallback. (A detailed
  brain was tried and rejected by the owner in favour of the sphere.)
- The dashboard (`src/modules/dashboard`) shows live data only, from one call
  to `GET /Dashboard/summary` (shop_back `DashboardController`). The browser's
  time zone is sent so activity days split at local midnight. The API returns
  null for sections the user can't read, and the page hides them. Don't put
  sample numbers back. Its hero reuses the login navy in
  both themes; charts are hand-rolled SVG in the `--primary` hue (no chart
  library).
- App chrome (`src/components/module/admin/layout`): the sidebar column and
  the header's brand block use the brand navy in both themes (`.app-sidebar`,
  scoped with `.dark`). The menu lives in `menu.ts` and feeds the sidebar, the
  collapsed icon rail (72px, flyouts for groups) and the Ctrl/⌘+K command
  palette. Add new pages to `menu.ts`, not to `Nav.tsx`. The collapsed state
  is kept in localStorage (`sidebar-collapsed`).
- `useTranslations().t` is memoized. Keep it stable: effects list `t` as a
  dependency, and a new function each render caused an infinite fetch loop
  on the docs pages.
- Keep `framer-motion` at 12.43 or later. 12.23 dropped every fade back to
  opacity 0 for one frame as it finished, so pages blinked once or twice
  after loading.
- Table pages use `useTable`. It treats a reply without a list as a failed
  load, and only the newest request updates the table. Show failures with
  `ErrorState` (message plus "Try again") from `components/custom/Table`.
- Dark mode splits blue in two: `--primary` is the fill (buttons, badges;
  white `--primary-foreground`) and `--primary-text` is blue text and icons.
  `text-primary` maps to `--primary-text` in dark mode automatically. Use
  `bg-primary text-primary-foreground` for filled buttons, never dark text on
  blue.
- Mobile: dialogs size themselves as `calc(100% - 2rem)`. Pass `sm:max-w-*`,
  not `max-w-*`, or the mobile margin is lost. Rows of header buttons must be
  allowed to wrap (`flex-wrap`), and side-by-side panels stack below `md`.
  Check new pages at 360px wide.
- The Mailbox is one card: a folder rail (chips on phones), a message list
  (`MailList` rows with sender, subject, preview and date) and `MailReader`.
  From 1280px wide the reader sits beside the list (split view, the folder
  rail shrinks to icons below 2xl; the "Split view" toggle is saved as
  `mail-split`). Narrower, the open message replaces the list, which stays
  mounted so its page and scroll survive. The reader updates list rows through
  `MailListHandle` (`patch`, `remove`) instead of reloading the list.
  Shortcuts: j / k for older / newer, Esc to close.
- The font is Inter, bundled through `@fontsource-variable/inter` (imported in `src/main.tsx`).

## Security notes

- Mail attachments are checked against an extension allow-list in
  `src/modules/mail/components/ComposeMail.tsx`. The API (`shop_back`) enforces
  the same list in `FileValidationPresets.MailAttachment`. Keep the two lists in sync.
