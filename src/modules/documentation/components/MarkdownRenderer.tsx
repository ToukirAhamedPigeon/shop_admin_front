// src/modules/documentation/components/MarkdownRenderer.tsx
import { useEffect, useState, isValidElement } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { AlertTriangle } from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';
import { cachedDiagram, renderDiagram } from '../mermaid';

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

// Pull the language + raw text out of the <code> element react-markdown
// nests inside <pre> for a fenced code block.
const getCodeInfo = (children: ReactNode): { lang?: string; raw: string } => {
  if (!isValidElement(children)) return { raw: '' };

  const codeProps = children.props as ComponentPropsWithoutRef<'code'>;
  const className = codeProps.className || '';
  const match = /language-(\w+)/.exec(className);
  const raw = String(codeProps.children ?? '').replace(/\n$/, '');
  return { lang: match?.[1], raw };
};

// One mermaid code block. Pages render their diagrams before showing (see
// prepareDiagrams), so this usually starts with the SVG already in the cache.
function MermaidBlock({ code }: { code: string }) {
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  const [svg, setSvg] = useState(() => cachedDiagram(code, isDarkMode));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hit = cachedDiagram(code, isDarkMode);
    if (hit) {
      setSvg(hit);
      return;
    }
    // Keep the current diagram on screen (e.g. the other theme) until the new one is ready.
    let cancelled = false;
    renderDiagram(code, isDarkMode)
      .then((markup) => {
        if (cancelled) return;
        setSvg(markup);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to render mermaid diagram:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      });
    return () => {
      cancelled = true;
    };
  }, [code, isDarkMode]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium mb-2">
          <AlertTriangle className="w-4 h-4" />
          Failed to render mermaid diagram
        </div>
        <pre className="whitespace-pre-wrap text-xs opacity-80">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return <div className="mermaid-container my-4 h-48 animate-pulse rounded-lg bg-muted/50" aria-label="Loading diagram" />;
  }

  // Sanitized in renderDiagram.
  return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
}

const markdownComponents: Components = {
  pre({ children, ...rest }) {
    const { lang, raw } = getCodeInfo(children);

    if (lang === 'mermaid') {
      return <MermaidBlock code={raw} />;
    }

    return <pre {...rest}>{children}</pre>;
  },
};

export default function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  if (!markdown) return null;

  return (
    <div className={`markdown-body ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
