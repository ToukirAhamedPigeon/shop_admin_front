// src/modules/documentation/pages/UserGuidePage.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import { ErrorState } from '@/components/custom/Table';
import { useAppSelector } from '@/hooks/useRedux';
import { useTranslations } from '@/hooks/useTranslations';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { DocPageSkeleton } from '../components/DocSkeleton';
import { getUserGuide } from '../api';
import { prepareDiagrams } from '../mermaid';
import { getErrorMessage } from '../utils';
import type { UserGuide } from '../types';

export default function UserGuidePage() {
  const { t } = useTranslations();
  const isDark = useAppSelector((s) => s.theme.current) === 'dark';
  const [guide, setGuide] = useState<UserGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read through refs so a translation or theme update doesn't refetch the guide.
  const tRef = useRef(t);
  const darkRef = useRef(isDark);
  tRef.current = t;
  darkRef.current = isDark;

  const loadGuide = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserGuide();
      await prepareDiagrams(data.markdown ?? '', darkRef.current);
      setGuide(data);
    } catch (err) {
      setError(getErrorMessage(err, tRef.current('documentation.guide.error', 'Failed to load the user guide')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuide();
  }, [loadGuide]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <Breadcrumb
        title="documentation.guide.title"
        defaultTitle="User Guide"
        showTitle
        items={[
          { label: 'documentation.title', defaultLabel: 'Documentation', href: '/docs/guide' },
          { label: 'documentation.guide.title', defaultLabel: 'User Guide', href: '/docs/guide' },
        ]}
        className="pb-0"
      />

      <GlassCard variant="primary" padding="md" hoverEffect={false} className="max-w-4xl mx-auto w-full">
        {error && !guide ? (
          <ErrorState message={error} onRetry={loadGuide} />
        ) : guide ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loading ? 0.6 : 1, transition: { duration: 0.18, ease: 'easeOut', delay: loading ? 0.15 : 0 } }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">{guide.title}</h2>
              {guide.updatedAt && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(guide.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
            <MarkdownRenderer markdown={guide.markdown} />
          </motion.div>
        ) : (
          <DocPageSkeleton />
        )}
      </GlassCard>
    </div>
  );
}
