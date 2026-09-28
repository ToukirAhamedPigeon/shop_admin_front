// src/modules/mail/pages/TemplatesPage.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, FileText, Globe, Lock, Search, Send, Eye, X } from 'lucide-react';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/custom/Table';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import ComposeMail from '../components/ComposeMail';
import TemplateFormDialog from '../components/TemplateFormDialog';
import { getTemplates, deleteTemplate } from '../api';
import { htmlToText, initialsOf } from '../components/mailFormat';
import type { MailTemplate } from '../types';
import { can } from '@/lib/authCheck';
import { dispatchShowToast } from '@/lib/dispatch';
import { cn } from '@/lib/utils';

type Scope = 'all' | 'global' | 'personal';


const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : format(d, 'MMM d, yyyy');
};

function ScopeBadge({ global }: { global: boolean }) {
  const Icon = global ? Globe : Lock;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        global ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
      )}
    >
      <Icon className="size-3" />
      {global ? 'Global' : 'Personal'}
    </span>
  );
}

const CardAction = ({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={cn(
      'flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
      danger ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-accent hover:text-foreground'
    )}
  >
    {children}
  </button>
);

function TemplateCard({
  template,
  index,
  onPreview,
  onUse,
  onEdit,
  onDelete,
}: {
  template: MailTemplate;
  index: number;
  onPreview: () => void;
  onUse?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const preview = useMemo(() => htmlToText(template.body).slice(0, 320), [template.body]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: Math.min(index * 0.03, 0.2) }}
      className="group flex min-w-0 flex-col rounded-xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-sm"
    >
      {/* A miniature of the email; opens the full preview. */}
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${template.name}`}
        className="relative m-3 mb-0 flex h-36 cursor-pointer flex-col justify-start overflow-hidden rounded-lg border border-border bg-muted/40 p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Subject</p>
        <p className="truncate text-sm font-semibold text-foreground">{template.subject || '(no subject)'}</p>
        <div className="my-2 h-px bg-border" />
        <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
          {preview || <span className="italic">Empty body</span>}
        </p>
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card/90 to-transparent" />
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
            <Eye className="size-3.5" />
            Preview
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[15px] font-semibold text-foreground" title={template.name}>
            {template.name}
          </h3>
          <ScopeBadge global={template.isGlobal} />
        </div>
        <p className={cn('mt-1 line-clamp-2 text-sm', template.description ? 'text-muted-foreground' : 'italic text-muted-foreground/70')}>
          {template.description || 'No description'}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
            >
              {initialsOf(template.createdByName || '?')}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {template.createdByName || 'Unknown'} · {shortDate(template.createdAt)}
            </p>
            <div className="-mr-1.5 flex shrink-0 items-center">
              {onUse && (
                <CardAction label={`Use ${template.name} in a new mail`} onClick={onUse}>
                  <Send className="size-4" />
                </CardAction>
              )}
              {onEdit && (
                <CardAction label={`Edit ${template.name}`} onClick={onEdit}>
                  <Pencil className="size-4" />
                </CardAction>
              )}
              {onDelete && (
                <CardAction label={`Delete ${template.name}`} onClick={onDelete} danger>
                  <Trash2 className="size-4" />
                </CardAction>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-3" aria-hidden>
      <div className="h-36 rounded-lg bg-muted" />
      <div className="space-y-2 p-1 pt-4">
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="mt-4 h-3 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MailTemplate | null>(null);

  const [previewing, setPreviewing] = useState<MailTemplate | null>(null);
  const [deleting, setDeleting] = useState<MailTemplate | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [composeTemplate, setComposeTemplate] = useState<MailTemplate | null>(null);

  const canCreate = can(['create-admin-mail-templates']);
  const canEdit = can(['update-admin-mail-templates']);
  const canDelete = can(['delete-admin-mail-templates']);
  const canSendMail = can(['create-admin-mails']);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await getTemplates({ page: 1, limit: 100, includeGlobal: true });
      setTemplates(Array.isArray(response.data?.templates) ? response.data.templates : []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const counts = useMemo(() => {
    const global = templates.filter((t) => t.isGlobal).length;
    return { all: templates.length, global, personal: templates.length - global };
  }, [templates]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (scope === 'global' && !t.isGlobal) return false;
      if (scope === 'personal' && t.isGlobal) return false;
      if (!q) return true;
      return [t.name, t.subject, t.description ?? ''].some((s) => s.toLowerCase().includes(q));
    });
  }, [templates, query, scope]);

  const openForm = (template?: MailTemplate) => {
    setEditing(template ?? null);
    setPreviewing(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteTemplate(deleting.id);
      dispatchShowToast({ type: 'success', message: 'Template deleted' });
      setTemplates((list) => list.filter((t) => t.id !== deleting.id));
    } catch {
      dispatchShowToast({ type: 'danger', message: 'Failed to delete template' });
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  const startMailFrom = (template: MailTemplate) => {
    setPreviewing(null);
    setComposeTemplate(template);
  };

  const scopes: { id: Scope; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'global', label: 'Global' },
    { id: 'personal', label: 'Personal' },
  ];

  let content: React.ReactNode;
  if (loading && templates.length === 0) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (loadError) {
    content = (
      <div className="rounded-xl border border-border bg-card">
        <ErrorState message="Couldn't load templates" suggestion="Check your connection and try again." onRetry={loadTemplates} />
      </div>
    );
  } else if (templates.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="size-7" />
        </span>
        <p className="text-base font-medium text-foreground">No templates yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Save emails you send often, such as a welcome note or an invoice reminder, and start new mail from them in one click.
        </p>
        {canCreate && (
          <Button onClick={() => openForm()} className="mt-2">
            <Plus className="size-4" />
            Create your first template
          </Button>
        )}
      </div>
    );
  } else if (visible.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-14 text-center">
        <Search className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No templates match</p>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            setQuery('');
            setScope('all');
          }}
        >
          Clear search and filters
        </Button>
      </div>
    );
  } else {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((template, index) => (
          <TemplateCard
            key={template.id}
            template={template}
            index={index}
            onPreview={() => setPreviewing(template)}
            onUse={canSendMail ? () => startMailFrom(template) : undefined}
            onEdit={canEdit ? () => openForm(template) : undefined}
            onDelete={canDelete ? () => setDeleting(template) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 [&>*:first-child]:min-w-0">
        <Breadcrumb
          title="common.mail.templates.title"
          defaultTitle="Mail Templates"
          showTitle={true}
          items={[
            { label: 'common.mail.title', defaultLabel: 'Mailbox', href: '/mail' },
            { label: 'common.mail.templates.title', defaultLabel: 'Templates', href: '/mail/templates' },
          ]}
          className="pb-0"
        />
        {canCreate && (
          <Button onClick={() => openForm()}>
            <Plus className="size-4" />
            New template
          </Button>
        )}
      </div>

      {/* Search and scope filter */}
      {!loadError && templates.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              aria-label="Search templates"
              className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div role="tablist" aria-label="Filter templates" className="flex w-full rounded-xl border border-border bg-muted/50 p-1 sm:w-auto">
            {scopes.map(({ id, label }) => {
              const active = scope === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(id)}
                  className={cn(
                    'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
                    active ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                  <span className={cn('text-xs tabular-nums', active ? 'text-primary' : 'text-muted-foreground')}>{counts[id]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {content}

      {/* Preview */}
      <Dialog open={!!previewing} onOpenChange={(open) => !open && setPreviewing(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {previewing && (
            <>
              <DialogHeader className="border-b border-border p-5 pr-12 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="min-w-0 text-lg [overflow-wrap:anywhere]">{previewing.name}</DialogTitle>
                  <ScopeBadge global={previewing.isGlobal} />
                </div>
                <DialogDescription>{previewing.description || 'Template preview'}</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
                <div className="rounded-xl border border-border bg-card shadow-xs">
                  <div className="border-b border-border px-5 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Subject</p>
                    <p className="font-semibold text-foreground [overflow-wrap:anywhere]">{previewing.subject}</p>
                  </div>
                  <div
                    className="markdown-body max-w-none px-5 py-4 [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewing.body) }}
                  />
                </div>
              </div>
              <DialogFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border p-4">
                {canEdit && (
                  <Button variant="outline" onClick={() => openForm(previewing)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                )}
                {canSendMail && (
                  <Button onClick={() => startMailFrom(previewing)}>
                    <Send className="size-4" />
                    Use in new mail
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / edit */}
      <TemplateFormDialog open={formOpen} template={editing} onClose={() => setFormOpen(false)} onSaved={loadTemplates} />

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete template"
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteBusy}
      >
        <p>
          Delete <span className="font-medium text-foreground">{deleting?.name}</span>? This can't be undone.
        </p>
      </ConfirmDialog>

      <ComposeMail
        open={!!composeTemplate}
        onClose={() => setComposeTemplate(null)}
        onSent={() => setComposeTemplate(null)}
        template={composeTemplate ?? undefined}
      />
    </motion.div>
  );
}
