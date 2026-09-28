// src/modules/documentation/pages/ChangelogPage.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { dispatchShowToast } from '@/lib/dispatch';
import ChangelogList from '../components/ChangelogList';
import { getChangelog } from '../api';
import { getErrorMessage } from '../utils';
import type { ChangelogEntry } from '../types';

const PAGE_SIZE = 20;

export default function ChangelogPage() {
  const { t } = useTranslations();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Read through a ref so a translation update doesn't reload the list.
  const tRef = useRef(t);
  tRef.current = t;

  const loadChangelog = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await getChangelog({ page: targetPage, pageSize: PAGE_SIZE });
      setEntries(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(Math.max(1, Math.ceil((data.totalCount || 0) / PAGE_SIZE)));
    } catch (error) {
      dispatchShowToast({
        type: 'danger',
        message: getErrorMessage(error, tRef.current('documentation.changelog.error', 'Failed to load changelog')),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChangelog(page);
  }, [page, loadChangelog]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Breadcrumb
          title="documentation.changelog.title"
          defaultTitle="Changelog"
          showTitle
          items={[
            { label: 'documentation.title', defaultLabel: 'Documentation', href: '/docs/changelog' },
            { label: 'documentation.changelog.title', defaultLabel: 'Changelog', href: '/docs/changelog' },
          ]}
          className="pb-0"
        />
        <Button
          onClick={() => loadChangelog(page)}
          disabled={loading}
          variant="outline"
          size="sm"
          className="cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('common.Refresh', 'Refresh')}
        </Button>
      </div>

      <GlassCard variant="default" padding="sm" hoverEffect={false}>
        <div className={loading && entries.length > 0 ? 'opacity-60 transition-opacity duration-200' : 'transition-opacity duration-200'}>
          <ChangelogList entries={entries} loading={loading && entries.length === 0} />
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm">
            <span className="text-muted-foreground">
              {t('documentation.changelog.total_count', 'Total entries')}: {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="cursor-pointer"
              >
                {t('common.Previous', 'Previous')}
              </Button>
              <span className="px-2 text-muted-foreground whitespace-nowrap">
                {t('documentation.changelog.page_of', 'Page')} {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="cursor-pointer"
              >
                {t('common.Next', 'Next')}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
