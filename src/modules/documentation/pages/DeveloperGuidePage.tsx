// src/modules/documentation/pages/DeveloperGuidePage.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import { ErrorState } from '@/components/custom/Table';
import { useAppSelector } from '@/hooks/useRedux';
import { useTranslations } from '@/hooks/useTranslations';
import DocSidebarTree from '../components/DocSidebarTree';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { DocPageSkeleton, DocTreeSkeleton, LoadingBar } from '../components/DocSkeleton';
import { getDeveloperTree, getDeveloperPage } from '../api';
import { prepareDiagrams } from '../mermaid';
import { getErrorMessage } from '../utils';
import type { DocTreeNode, DocPage } from '../types';

// Find the first file in the tree, depth-first, used as the default page.
const findFirstFile = (nodes: DocTreeNode[]): string | undefined => {
  for (const node of nodes) {
    if (node.isFile) return node.slug;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return undefined;
};

export default function DeveloperGuidePage() {
  const { t } = useTranslations();
  const isDark = useAppSelector((s) => s.theme.current) === 'dark';
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get('slug') || undefined;

  const [tree, setTree] = useState<DocTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [page, setPage] = useState<DocPage | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Loaders read these through refs: a translation or theme update must not
  // refetch (and blank) the page that is already on screen.
  const tRef = useRef(t);
  const darkRef = useRef(isDark);
  const slugRef = useRef(activeSlug);
  // setSearchParams changes identity with every URL change; the tree loads once.
  const setParamsRef = useRef(setSearchParams);
  setParamsRef.current = setSearchParams;
  tRef.current = t;
  darkRef.current = isDark;
  slugRef.current = activeSlug;

  const latestPage = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
    try {
      const data = await getDeveloperTree();
      setTree(Array.isArray(data) ? data : []);
      if (!slugRef.current) {
        const firstFile = findFirstFile(Array.isArray(data) ? data : []);
        if (firstFile) setParamsRef.current({ slug: firstFile }, { replace: true });
      }
    } catch (error) {
      setTreeError(getErrorMessage(error, tRef.current('documentation.developer.tree_error', 'Failed to load documentation tree')));
    } finally {
      setTreeLoading(false);
    }
  }, []);

  const loadPage = useCallback(async (slug: string) => {
    const request = ++latestPage.current;
    // The current page stays on screen (with a loading bar) until the next is ready.
    setPageLoading(true);
    setPageError(null);
    try {
      const data = await getDeveloperPage(slug);
      await prepareDiagrams(data.markdown ?? '', darkRef.current);
      if (request !== latestPage.current) return;
      setPage(data);
      contentRef.current?.scrollTo({ top: 0 });
    } catch (error) {
      if (request !== latestPage.current) return;
      setPage(null);
      setPageError(getErrorMessage(error, tRef.current('documentation.developer.page_error', 'Failed to load documentation page')));
    } finally {
      if (request === latestPage.current) setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (activeSlug) loadPage(activeSlug);
  }, [activeSlug, loadPage]);

  const handleSelectFile = (slug: string) => {
    if (slug !== activeSlug) setSearchParams({ slug });
  };

  const showSkeleton = !page && !pageError && (pageLoading || treeLoading || !!activeSlug);

  return (
    <div className="flex flex-col gap-4 h-full">
      <Breadcrumb
        title="documentation.developer.title"
        defaultTitle="Developer Guide"
        showTitle
        items={[
          { label: 'documentation.title', defaultLabel: 'Documentation', href: '/docs/developer' },
          { label: 'documentation.developer.title', defaultLabel: 'Developer Guide', href: '/docs/developer' },
        ]}
        className="pb-0"
      />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 flex-1 min-h-0">
        <GlassCard variant="default" padding="sm" hoverEffect={false} className="md:h-full md:overflow-y-auto">
          {treeLoading && tree.length === 0 ? (
            <DocTreeSkeleton />
          ) : treeError ? (
            <ErrorState message={treeError} onRetry={loadTree} />
          ) : (
            <DocSidebarTree nodes={tree} activeSlug={activeSlug} onSelectFile={handleSelectFile} />
          )}
        </GlassCard>

        <GlassCard variant="primary" padding="none" hoverEffect={false} className="md:h-full md:min-h-0 [&>div]:md:h-full">
          <LoadingBar active={pageLoading && !!page} />
          <div ref={contentRef} className="p-6 md:h-full md:overflow-y-auto" aria-busy={pageLoading}>
            {showSkeleton ? (
              <DocPageSkeleton />
            ) : pageError ? (
              <ErrorState message={pageError} onRetry={activeSlug ? () => loadPage(activeSlug) : undefined} />
            ) : page ? (
              <motion.div
                initial={{ opacity: 0 }}
                // Dim only if the next page is slow to arrive, so quick switches don't pulse.
                animate={{ opacity: pageLoading ? 0.6 : 1, transition: { duration: 0.18, ease: 'easeOut', delay: pageLoading ? 0.15 : 0 } }}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{page.title}</h2>
                  {page.updatedAt && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(page.updatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <MarkdownRenderer markdown={page.markdown} />
                {page.sourcePaths && page.sourcePaths.length > 0 && (
                  <div className="pt-3 mt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {t('documentation.developer.source_paths', 'Source')}
                    </p>
                    <ul className="space-y-0.5">
                      {page.sourcePaths.map((path) => (
                        <li key={path} className="text-xs font-mono text-muted-foreground truncate">
                          {path}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                {t('documentation.developer.select_page', 'Select a page from the sidebar')}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
