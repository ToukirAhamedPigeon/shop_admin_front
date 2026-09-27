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
- The font is Inter, bundled through `@fontsource-variable/inter` (imported in `src/main.tsx`).

## Security notes

- Mail attachments are checked against an extension allow-list in
  `src/modules/mail/components/ComposeMail.tsx`. The API (`shop_back`) enforces
  the same list in `FileValidationPresets.MailAttachment`. Keep the two lists in sync.
