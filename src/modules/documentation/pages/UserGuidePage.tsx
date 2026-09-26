// src/modules/documentation/pages/UserGuidePage.tsx
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import Loader from '@/components/custom/Loader';
import { useTranslations } from '@/hooks/useTranslations';
import { dispatchShowToast } from '@/lib/dispatch';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { getUserGuide } from '../api';
import { getErrorMessage } from '../utils';
import type { UserGuide } from '../types';

export default function UserGuidePage() {
  const { t } = useTranslations();
  const [guide, setGuide] = useState<UserGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadGuide = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getUserGuide();
      setGuide(data);
    } catch (err) {
      setError(true);
      dispatchShowToast({
        type: 'danger',
        message: getErrorMessage(err, t('documentation.guide.error', 'Failed to load the user guide')),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadGuide();
  }, [loadGuide]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 h-full"
    >
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader type="circular" size={36} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            {t('documentation.guide.error', 'Failed to load the user guide')}
          </div>
        ) : guide ? (
          <div className="space-y-3">
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
          </div>
        ) : null}
      </GlassCard>
    </motion.div>
  );
}
