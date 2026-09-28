// src/lib/themeColors.ts
// Turns the colours saved in App Settings into CSS variables. The picked hex
// only sets the hue and saturation: lightness is clamped per use so white
// button text stays readable (WCAG AA) and dark mode keeps its split between
// a mid-tone fill (--primary) and a lighter text tone (--primary-text).

/** Server defaults (shop_back UserSettingRepository). Left alone, the designed palette stays. */
export const DEFAULT_PRIMARY = '#3b82f6';
export const DEFAULT_SECONDARY = '#10b981';

interface Oklch {
  l: number;
  c: number;
  h: number;
}

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

export function hexToOklch(hex: string): Oklch | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  let v = m[1];
  if (v.length === 3) v = v.split('').map((ch) => ch + ch).join('');
  const toLinear = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map((i) => toLinear(parseInt(v.slice(i, i + 2), 16) / 255));

  // sRGB → OKLab (Björn Ottosson)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** OKLCH → linear sRGB (may fall outside 0..1 when out of gamut). */
function toLinearRgb(l: number, c: number, h: number): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** Largest chroma ≤ c that sRGB can show at this lightness and hue. */
function fitChroma(l: number, c: number, h: number) {
  if (inGamut(toLinearRgb(l, c, h))) return c;
  let lo = 0;
  let hi = c;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(toLinearRgb(l, mid, h))) lo = mid;
    else hi = mid;
  }
  return lo;
}

const luminance = (l: number, c: number, h: number) => {
  const [r, g, b] = toLinearRgb(l, c, h).map((v) => clamp(v, 0, 1));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The lightest tone ≤ maxL (same hue, chroma fitted to sRGB) whose contrast
 * with white is at least `target`. Browsers then draw exactly this colour.
 */
function fillTone(maxL: number, c: number, h: number, target: number) {
  for (let l = maxL; l > 0.2; l -= 0.005) {
    const cc = fitChroma(l, c, h);
    if (1.05 / (luminance(l, cc, h) + 0.05) >= target) return { l, c: cc };
  }
  return { l: 0.2, c: fitChroma(0.2, c, h) };
}
const f = (x: number, d = 3) => Number(x.toFixed(d));
const ok = (l: number, c: number, h: number, alpha?: number) =>
  `oklch(${f(l)} ${f(c)} ${f(h, 1)}${alpha === undefined ? '' : ` / ${alpha}`})`;

const same = (a?: string | null, b?: string) => (a ?? '').trim().toLowerCase() === (b ?? '').toLowerCase();

/**
 * CSS for the user's colours, or '' when they match the defaults (or are not
 * valid hex). Selectors outrank the `:root` / `.dark` blocks in index.css; the
 * `html .dark` form also reaches the sidebar, which carries its own `.dark`.
 */
export function buildThemeCss(primary?: string | null, secondary?: string | null): string {
  const rules: string[] = [];
  const p = !same(primary, DEFAULT_PRIMARY) && primary ? hexToOklch(primary) : null;
  const s = !same(secondary, DEFAULT_SECONDARY) && secondary ? hexToOklch(secondary) : null;

  if (p) {
    // Greys have no meaningful hue; keep them neutral instead of tinting by noise.
    const c = p.c < 0.02 ? 0 : clamp(p.c, 0.06, 0.2);
    // Light mode: the fill doubles as link/text colour on a near-white page, so
    // aim a little above 4.5:1. Dark mode: white button text on the fill.
    const light = fillTone(clamp(p.l, 0.34, 0.55), c, p.h, 4.8);
    const dark = fillTone(clamp(p.l, 0.5, 0.57), c, p.h, 4.6);
    const darkText = { l: 0.76, c: fitChroma(0.76, Math.min(c, 0.13), p.h) };
    const nav = fillTone(0.56, c, p.h, 4.6);
    rules.push(
      `html:root{--primary:${ok(light.l, light.c, p.h)};--primary-foreground:oklch(0.99 0 0);--primary-text:${ok(light.l, light.c, p.h)};--ring:${ok(light.l, light.c, p.h, 0.45)};--sidebar-primary:${ok(light.l, light.c, p.h)};}`,
      `html.dark,html .dark{--primary:${ok(dark.l, dark.c, p.h)};--primary-foreground:oklch(0.99 0 0);--primary-text:${ok(darkText.l, darkText.c, p.h)};--ring:${ok(0.68, fitChroma(0.68, Math.min(c, 0.14), p.h), p.h, 0.5)};--sidebar-primary:${ok(dark.l, dark.c, p.h)};}`,
      `html .app-sidebar{--sidebar-primary:${ok(nav.l, nav.c, p.h)};--sidebar-ring:${ok(0.7, fitChroma(0.7, Math.min(c, 0.14), p.h), p.h)};}`,
      `html .nav-active{background:linear-gradient(100deg,${ok(nav.l, nav.c, p.h)},${ok(nav.l - 0.04, fitChroma(nav.l - 0.04, c, (p.h + 8) % 360), (p.h + 8) % 360)});box-shadow:0 6px 16px -6px ${ok(nav.l, nav.c, p.h, 0.7)},inset 0 1px 0 oklch(1 0 0 / 0.14);}`
    );
  }

  if (s) {
    // Secondary surfaces (secondary buttons, soft badges): a quiet tint of the hue.
    const c = s.c < 0.02 ? 0 : Math.min(s.c, 0.05);
    rules.push(
      `html:root{--secondary:${ok(0.955, c * 0.5, s.h)};--secondary-foreground:${ok(0.3, Math.min(s.c, 0.08), s.h)};}`,
      `html.dark,html .dark{--secondary:${ok(0.28, c * 0.6, s.h)};--secondary-foreground:${ok(0.94, Math.min(s.c, 0.04), s.h)};}`
    );
  }

  return rules.join('\n');
}
