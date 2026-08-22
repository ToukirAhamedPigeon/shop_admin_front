// src/modules/documentation/components/MarkdownRenderer.tsx
import { useEffect, useId, useRef, useState, isValidElement } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { AlertTriangle } from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';
import Loader from '@/components/custom/Loader';

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

// Renders a single mermaid code block to sanitized SVG on the client.
function MermaidBlock({ code }: { code: string }) {
  const reactId = useId();
  const mermaidId = `mermaid-${reactId.replace(/[:]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDarkMode ? 'dark' : 'default',
        });
        const { svg } = await mermaid.render(mermaidId, code);
        if (cancelled) return;
        // Defense-in-depth: mermaid output is generated client-side from
        // markdown content, sanitize the SVG markup before injecting it.
        const safeSvg = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
        if (containerRef.current) {
          containerRef.current.innerHTML = safeSvg;
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to render mermaid diagram:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [code, mermaidId, isDarkMode]);

  if (error) {
    return (
      <div className="my-4 p-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
        <div className="flex items-center gap-2 font-medium mb-2">
          <AlertTriangle className="w-4 h-4" />
          Failed to render mermaid diagram
        </div>
        <pre className="whitespace-pre-wrap text-xs opacity-80">{code}</pre>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-container" />;
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
  if (!markdown) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader type="circular" size={36} />
      </div>
    );
  }

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
