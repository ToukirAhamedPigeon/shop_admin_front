// src/modules/documentation/components/ChangelogList.tsx
import { Fragment, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight, FileDiff, GitCommitHorizontal } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/useTranslations';
import type { ChangelogEntry } from '../types';

interface ChangelogListProps {
  entries: ChangelogEntry[];
  loading?: boolean;
}

// A single consistent, muted badge style for every repo — no per-item color cycling.
const repoBadgeColor = (_repo: string) => 'bg-muted text-muted-foreground border-border';

export default function ChangelogList({ entries, loading }: ChangelogListProps) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (sha: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sha)) next.delete(sha);
      else next.add(sha);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800/50" />
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <GitCommitHorizontal className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-sm">{t('documentation.changelog.empty', 'No changelog entries found')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>{t('documentation.changelog.date', 'Date')}</TableHead>
            <TableHead>{t('documentation.changelog.repo', 'Repo')}</TableHead>
            <TableHead>{t('documentation.changelog.subject', 'Commit')}</TableHead>
            <TableHead>{t('documentation.changelog.author', 'Author')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isOpen = expanded.has(entry.sha);
            const hasDetails = !!(entry.files && entry.files.length > 0);

            return (
              <Fragment key={entry.sha}>
                <TableRow
                  className={hasDetails ? 'cursor-pointer' : ''}
                  onClick={() => hasDetails && toggleExpanded(entry.sha)}
                >
                  <TableCell>
                    {hasDetails &&
                      (isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      ))}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {(() => {
                      try {
                        return format(parseISO(entry.date), 'yyyy-MM-dd HH:mm');
                      } catch {
                        return entry.date;
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={repoBadgeColor(entry.repo)}>
                      {entry.repo}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate font-medium text-gray-800 dark:text-gray-100">
                    {entry.summary}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {entry.author || '—'}
                  </TableCell>
                </TableRow>

                {isOpen && hasDetails && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900/40 whitespace-normal">
                      <div className="py-2 space-y-3">
                        {entry.files && entry.files.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                              <FileDiff className="w-3.5 h-3.5" />
                              {t('documentation.changelog.files_changed', 'Files changed')} (
                              {entry.files.length})
                            </div>
                            <ul className="space-y-0.5 max-h-48 overflow-y-auto">
                              {entry.files.map((file) => (
                                <li
                                  key={file}
                                  className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate"
                                >
                                  {file}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
