// src/modules/documentation/mermaid.ts
// Mermaid diagrams, rendered once and cached. Mermaid is large (~3 MB), so it
// is imported on first use instead of shipping in the main bundle.
import DOMPurify from 'dompurify';

type Mermaid = typeof import('mermaid').default;

let mermaidPromise: Promise<Mermaid> | null = null;
const loadMermaid = () => (mermaidPromise ??= import('mermaid').then((m) => m.default));

const pending = new Map<string, Promise<string>>();
const rendered = new Map<string, string>();
// mermaid.render uses global config (the theme), so renders run one at a time.
let queue: Promise<unknown> = Promise.resolve();
let seq = 0;

const keyOf = (code: string, dark: boolean) => `${dark ? 'dark' : 'light'}\n${code}`;

/** The SVG if this diagram has already been rendered for this theme. */
export const cachedDiagram = (code: string, dark: boolean) => rendered.get(keyOf(code, dark));

/** Render a diagram to sanitized SVG markup (cached per theme). */
export function renderDiagram(code: string, dark: boolean): Promise<string> {
  const key = keyOf(code, dark);
  const existing = pending.get(key);
  if (existing) return existing;

  const job = queue.then(async () => {
    const mermaid = await loadMermaid();
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'default' });
    const { svg } = await mermaid.render(`mermaid-${++seq}`, code);
    // Defense-in-depth: the SVG comes from markdown content; sanitize it.
    const safe = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
    rendered.set(key, safe);
    return safe;
  });
  queue = job.catch(() => undefined);
  pending.set(key, job);
  job.catch(() => pending.delete(key)); // let a failed diagram try again later
  return job;
}

// Same text react-markdown hands the code block (one trailing newline dropped).
const mermaidBlocks = (markdown: string) =>
  [...markdown.replace(/\r\n/g, '\n').matchAll(/^```mermaid[^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1].replace(/\n$/, ''));

/**
 * Render a page's diagrams before the page is shown, so it appears in one
 * piece instead of diagrams popping in (and pushing the text down) later.
 * Gives up waiting after `maxWait`; slow diagrams then finish in place.
 */
export async function prepareDiagrams(markdown: string, dark: boolean, maxWait = 2500) {
  const blocks = mermaidBlocks(markdown);
  if (blocks.length === 0) return;
  const all = Promise.allSettled(blocks.map((code) => renderDiagram(code, dark)));
  await Promise.race([all, new Promise((resolve) => setTimeout(resolve, maxWait))]);
}
