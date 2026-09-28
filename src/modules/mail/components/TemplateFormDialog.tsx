// src/modules/mail/components/TemplateFormDialog.tsx
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import DOMPurify from 'dompurify';
import { Eye, FilePlus2, Globe, Loader2, Lock, PenLine, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import RichTextEditor from '@/components/custom/RichTextEditor';
import { dispatchShowToast } from '@/lib/dispatch';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/hooks/useRedux';
import { createTemplate, updateTemplate } from '../api';
import { htmlToText, initialsOf } from './mailFormat';
import type { MailTemplate } from '../types';

type FormState = { name: string; subject: string; body: string; description: string; isGlobal: boolean };
type FormErrors = Partial<Record<'name' | 'subject' | 'body', string>>;

const EMPTY_FORM: FormState = { name: '', subject: '', body: '', description: '', isGlobal: false };
/** Many inboxes cut the subject off around here. */
const SUBJECT_SOFT_LIMIT = 70;

const fromTemplate = (t?: MailTemplate | null): FormState =>
  t ? { name: t.name, subject: t.subject, body: t.body, description: t.description || '', isGlobal: t.isGlobal } : EMPTY_FORM;

const same = (a: FormState, b: FormState) =>
  a.name === b.name &&
  a.subject === b.subject &&
  a.description === b.description &&
  a.isGlobal === b.isGlobal &&
  // The editor rewrites markup ("" → "<p></p>"), so compare what it says.
  htmlToText(a.body) === htmlToText(b.body);

interface Props {
  open: boolean;
  /** The template being edited; null or undefined creates a new one. */
  template?: MailTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

function ScopeOption({
  checked,
  onSelect,
  icon: Icon,
  title,
  hint,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: typeof Globe;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'flex min-w-0 flex-1 items-start gap-3 rounded-xl border p-3 text-left outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50',
        checked ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-accent/50'
      )}
    >
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', checked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          'ml-auto mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-primary' : 'border-muted-foreground/40'
        )}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
    </button>
  );
}

/** How the email will look: the inbox row, then the opened message. */
function EmailPreview({ form, sender }: { form: FormState; sender: string }) {
  const text = htmlToText(form.body);
  const html = useMemo(() => DOMPurify.sanitize(form.body || ''), [form.body]);
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">In the inbox</p>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
            {initialsOf(sender)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{sender}</p>
              <span className="shrink-0 text-[11px] text-muted-foreground">now</span>
            </div>
            <p className={cn('truncate text-sm', form.subject ? 'text-foreground' : 'italic text-muted-foreground')}>
              {form.subject || '(no subject)'}
            </p>
            <p className="truncate text-xs text-muted-foreground">{text || 'Empty body'}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Opened</p>
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <div className="border-b border-border px-4 py-3">
            <p className="font-semibold text-foreground [overflow-wrap:anywhere]">{form.subject || '(no subject)'}</p>
          </div>
          {text ? (
            <div className="markdown-body tiptap max-w-none px-4 py-3 text-sm [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="px-4 py-8 text-center text-sm italic text-muted-foreground">The message will appear here as you write.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplateFormDialog({ open, template, onClose, onSaved }: Props) {
  const senderName = useAppSelector((s) => s.auth.user?.name) || 'You';
  const [initial, setInitial] = useState<FormState>(EMPTY_FORM);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [pane, setPane] = useState<'write' | 'preview'>('write');
  const [confirmClose, setConfirmClose] = useState(false);
  // Remounts the editor for each opening, since it reads `value` only on mount.
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    const start = fromTemplate(template);
    setInitial(start);
    setForm(start);
    setErrors({});
    setPane('write');
    setEditorKey((k) => k + 1);
  }, [open, template]);

  const editing = !!template;
  const dirty = !same(form, initial);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = async () => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Give the template a name';
    if (!form.subject.trim()) next.subject = 'Add a subject line';
    if (!htmlToText(form.body)) next.body = 'Write the email body';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setPane('write');
      return;
    }

    setSaving(true);
    try {
      if (template) {
        await updateTemplate(template.id, form);
        dispatchShowToast({ type: 'success', message: 'Template updated' });
      } else {
        await createTemplate(form);
        dispatchShowToast({ type: 'success', message: 'Template created' });
      }
      onSaved();
      onClose();
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      dispatchShowToast({ type: 'danger', message: message || 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmClose(true);
    else onClose();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!saving) save();
    }
  };

  const subjectLength = form.subject.length;

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={onKeyDown}
          className="flex h-[92vh] max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        >
          {/* Title bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {editing ? <Pencil className="size-4" /> : <FilePlus2 className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-semibold">{editing ? `Edit “${template?.name}”` : 'New template'}</DialogTitle>
              <DialogDescription className="truncate text-xs">
                {editing ? 'Changes apply to new mail started from this template.' : 'Save an email you send often and reuse it from Compose.'}
              </DialogDescription>
            </div>
            <div role="tablist" aria-label="View" className="order-last flex w-full rounded-lg border border-border bg-card p-0.5 sm:order-none sm:w-auto lg:hidden">
              {(
                [
                  ['write', 'Write', PenLine],
                  ['preview', 'Preview', Eye],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={pane === id}
                  onClick={() => setPane(id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150',
                    pane === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </button>
          </div>

          <form
            id="template-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            {/* Write */}
            <div className={cn('min-h-0 space-y-5 overflow-y-auto p-4 sm:p-5', pane === 'preview' && 'hidden lg:block')}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-name">Name</Label>
                  <Input
                    id="tpl-name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="e.g. Welcome email"
                    autoFocus={!editing}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'tpl-name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="tpl-name-error" className="text-xs text-destructive">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-description">
                    Description <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="tpl-description"
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="When should this template be used?"
                    rows={1}
                    className="min-h-9 resize-y"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground" id="tpl-scope-label">
                  Who can use it
                </p>
                <div role="radiogroup" aria-labelledby="tpl-scope-label" className="flex flex-col gap-2 sm:flex-row">
                  <ScopeOption
                    checked={!form.isGlobal}
                    onSelect={() => setField('isGlobal', false)}
                    icon={Lock}
                    title="Only me"
                    hint="Shows in your Compose only."
                  />
                  <ScopeOption
                    checked={form.isGlobal}
                    onSelect={() => setField('isGlobal', true)}
                    icon={Globe}
                    title="Everyone"
                    hint="Every user can start mail from it."
                  />
                </div>
              </div>

              {/* The email itself, framed like Compose */}
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Email</p>
                <div
                  className={cn(
                    'overflow-hidden rounded-xl border bg-card shadow-xs',
                    errors.body || errors.subject ? 'border-destructive/60' : 'border-border'
                  )}
                >
                  <div className="border-b border-border">
                    <div className="flex min-h-11 items-center gap-3 px-4">
                      <label htmlFor="tpl-subject" className="w-14 shrink-0 text-sm text-muted-foreground">
                        Subject
                      </label>
                      <input
                        id="tpl-subject"
                        value={form.subject}
                        onChange={(e) => setField('subject', e.target.value)}
                        placeholder="What recipients see in their inbox"
                        aria-invalid={!!errors.subject}
                        aria-describedby="tpl-subject-hint"
                        className="h-11 min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                      />
                      <span
                        id="tpl-subject-hint"
                        className={cn('shrink-0 text-xs tabular-nums', subjectLength > SUBJECT_SOFT_LIMIT ? 'text-warning' : 'text-muted-foreground')}
                        title={subjectLength > SUBJECT_SOFT_LIMIT ? 'Long subjects get cut off in many inboxes' : undefined}
                      >
                        {subjectLength}/{SUBJECT_SOFT_LIMIT}
                      </span>
                    </div>
                    {errors.subject && <p className="-mt-1 pb-2 pl-[4.5rem] text-xs text-destructive">{errors.subject}</p>}
                  </div>
                  <RichTextEditor
                    key={editorKey}
                    value={form.body}
                    onChange={(value) => setField('body', value)}
                    placeholder="Write the email…"
                    height="240px"
                    bare
                  />
                </div>
                {errors.body && <p className="mt-1.5 text-xs text-destructive">{errors.body}</p>}
              </div>
            </div>

            {/* Preview */}
            <aside
              aria-label="Preview"
              className={cn('min-h-0 overflow-y-auto border-border bg-muted/30 p-4 sm:p-5 lg:block lg:border-l', pane === 'write' && 'hidden')}
            >
              <EmailPreview form={form} sender={senderName} />
            </aside>
          </form>

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card px-4 py-3 sm:px-5">
            <span className="mr-auto hidden text-xs text-muted-foreground md:inline">
              {dirty ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-warning" />
                  Unsaved changes
                </span>
              ) : (
                'No changes yet'
              )}
              <span className="mx-1.5">·</span>
              <kbd className="rounded border border-border bg-muted px-1 font-sans">Ctrl</kbd> +{' '}
              <kbd className="rounded border border-border bg-muted px-1 font-sans">Enter</kbd> to save
            </span>
            <Button type="button" variant="outline" onClick={requestClose} disabled={saving} className="ml-auto md:ml-0">
              Cancel
            </Button>
            <Button type="submit" form="template-form" disabled={saving || (editing && !dirty)}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
        title="Discard your changes?"
        variant="warning"
        confirmLabel="Discard"
      >
        <p>{editing ? 'The template keeps its saved version.' : 'This template will not be created.'}</p>
      </ConfirmDialog>
    </>
  );
}
