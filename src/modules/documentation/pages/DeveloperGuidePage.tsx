// src/modules/documentation/pages/DeveloperGuidePage.tsx
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import Loader from '@/components/custom/Loader';
import { useTranslations } from '@/hooks/useTranslations';
import { dispatchShowToast } from '@/lib/dispatch';
import DocSidebarTree from '../components/DocSidebarTree';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { getDeveloperTree, getDeveloperPage } from '../api';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get('slug') || undefined;

  const [tree, setTree] = useState<DocTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState(false);

  const [page, setPage] = useState<DocPage | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState(false);

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(false);
    try {
      const data = await getDeveloperTree();
      setTree(data);
      if (!activeSlug) {
        const firstFile = findFirstFile(data);
        if (firstFile) {
          setSearchParams({ slug: firstFile }, { replace: true });
        }
      }
    } catch (error) {
      setTreeError(true);
      dispatchShowToast({
        type: 'danger',
        message: getErrorMessage(error, t('documentation.developer.tree_error', 'Failed to load documentation tree')),
      });
    } finally {
      setTreeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPage = useCallback(
    async (slug: string) => {
      setPageLoading(true);
      setPageError(false);
      try {
        const data = await getDeveloperPage(slug);
        setPage(data);
      } catch (error) {
        setPageError(true);
        setPage(null);
        dispatchShowToast({
          type: 'danger',
          message: getErrorMessage(error, t('documentation.developer.page_error', 'Failed to load documentation page')),
        });
      } finally {
        setPageLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (activeSlug) {
      loadPage(activeSlug);
    }
  }, [activeSlug, loadPage]);

  const handleSelectFile = (slug: string) => {
    setSearchParams({ slug });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 h-full"
    >
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
          {treeLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader type="circular" size={28} />
            </div>
          ) : treeError ? (
            <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              {t('documentation.developer.tree_error', 'Failed to load documentation tree')}
            </div>
          ) : (
            <DocSidebarTree nodes={tree} activeSlug={activeSlug} onSelectFile={handleSelectFile} />
          )}
        </GlassCard>

        <GlassCard variant="primary" padding="md" hoverEffect={false} className="md:h-full md:overflow-y-auto">
          {pageLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader type="circular" size={36} />
            </div>
          ) : pageError ? (
            <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              {t('documentation.developer.page_error', 'Failed to load documentation page')}
            </div>
          ) : page ? (
            <div className="space-y-3">
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
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              {t('documentation.developer.select_page', 'Select a page from the sidebar')}
            </div>
          )}
        </GlassCard>
      </div>
    </motion.div>
  );
}
