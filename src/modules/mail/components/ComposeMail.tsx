// src/modules/mail/components/ComposeMail.tsx
import { useState, useEffect, useRef, type DragEvent, type KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  AlertCircle,
  Archive,
  File,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Image,
  LayoutTemplate,
  Loader2,
  Paperclip,
  Reply,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { sendMail, getTemplates } from '../api';
import { dispatchShowToast } from '@/lib/dispatch';
import RichTextEditor from '@/components/custom/RichTextEditor';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import type { MailTemplate } from '../types';
import { cn } from '@/lib/utils';

const schema = z.object({
  toMail: z.string().min(1, 'Recipient is required').email('Invalid email format'),
  ccMail: z.string().optional(),
  bccMail: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ComposeMailProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  replyTo?: { id?: number; toMail?: string; subject?: string; fromMail?: string };
  /** Start from this template (the Templates page's "Use" button). */
  template?: MailTemplate;
}

const MB = 1024 * 1024;
const MAX_FILE_SIZE = 25 * MB;
const MAX_TOTAL_ATTACHMENTS_SIZE = 50 * MB;

// Allowed attachment extensions. Checked by extension rather than MIME type
// because browsers report MIME inconsistently (often empty for .7z/.rar, and
// Windows reports .csv as application/vnd.ms-excel). HTML and SVG are
// deliberately excluded: both can carry scripts and are common phishing
// vectors. This is a UX guard only; the API must enforce its own allow-list.
const ALLOWED_ATTACHMENT_EXTENSIONS = [
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'xml',
  // Archives
  'zip', 'rar', '7z',
  // Audio
  'mp3', 'wav', 'ogg', 'm4a', 'flac',
  // Video
  'mp4', 'mpeg', 'mpg', 'mov', 'avi', 'mkv',
];

const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(',');

const getFileExtension = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
};

/** Icon and tone for an attachment chip, by extension. */
function fileKind(file: File) {
  const ext = getFileExtension(file.name);
  if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return { icon: Image, tone: 'bg-info/10 text-info' };
  if (file.type.startsWith('video/') || ['mp4', 'mpeg', 'mpg', 'mov', 'avi', 'mkv'].includes(ext)) return { icon: FileVideo, tone: 'bg-primary/10 text-primary' };
  if (file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return { icon: FileAudio, tone: 'bg-primary/10 text-primary' };
  if (ext === 'pdf') return { icon: FileText, tone: 'bg-destructive/10 text-destructive' };
  if (['xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return { icon: FileSpreadsheet, tone: 'bg-success/10 text-success' };
  if (['doc', 'docx', 'txt', 'rtf', 'xml'].includes(ext)) return { icon: FileText, tone: 'bg-info/10 text-info' };
  if (['zip', 'rar', '7z'].includes(ext)) return { icon: Archive, tone: 'bg-warning/10 text-warning' };
  return { icon: File, tone: 'bg-muted text-muted-foreground' };
}

/** One "Label  value" line of the envelope, Gmail style. */
function EnvelopeRow({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border">
      <div className="flex min-h-11 items-center gap-3 px-4 sm:px-5">
        <label htmlFor={htmlFor} className="w-14 shrink-0 text-sm text-muted-foreground">
          {label}
        </label>
        {children}
      </div>
      {error && (
        <p className="-mt-1 pb-2 pl-[4.25rem] text-xs text-destructive sm:pl-[4.75rem]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const bareInput =
  'h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70';

export default function ComposeMail({ open, onClose, onSent, replyTo, template }: ComposeMailProps) {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // Content loaded into the editor from outside (template, reply). A new key remounts it.
  const [seed, setSeed] = useState({ key: 0, html: '' });
  const [bodyEdited, setBodyEdited] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { toMail: '', ccMail: '', bccMail: '', subject: '', body: '' },
  });

  const loadBody = (html: string) => {
    setValue('body', html);
    setSeed((s) => ({ key: s.key + 1, html }));
  };

  useEffect(() => {
    if (!open) return;
    let active = true;
    getTemplates({ page: 1, limit: 50, includeGlobal: true })
      .then((response) => {
        if (active) setTemplates(response.data.templates ?? []);
      })
      .catch((error) => console.error('Failed to load templates:', error));
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!replyTo || !open) return;
    if (replyTo.toMail) setValue('toMail', replyTo.toMail);
    if (replyTo.subject) setValue('subject', replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
    if (replyTo.fromMail) {
      const html = `<p></p><blockquote><p>--- Original Message ---<br>From: ${replyTo.fromMail}<br>Subject: ${replyTo.subject ?? ''}</p></blockquote>`;
      setValue('body', html);
      setSeed((s) => ({ key: s.key + 1, html }));
    }
  }, [replyTo, open, setValue]);

  useEffect(() => {
    if (!template || !open) return;
    setValue('subject', template.subject);
    setValue('body', template.body || '');
    setSeed((s) => ({ key: s.key + 1, html: template.body || '' }));
    setTemplateId(template.id.toString());
  }, [template, open, setValue]);

  useEffect(() => () => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
  }, []);

  const handleTemplateChange = (id: string) => {
    const picked = templates.find((t) => t.id.toString() === id);
    if (!picked) return;
    setTemplateId(id);
    setValue('subject', picked.subject, { shouldValidate: !!errors.subject });
    loadBody(picked.body || '');
    setBodyEdited(false);
  };

  const currentTotalSize = attachments.reduce((sum, file) => sum + file.size, 0);
  const totalSizePercent = (currentTotalSize / MAX_TOTAL_ATTACHMENTS_SIZE) * 100;

  const showError = (message: string) => {
    setUploadError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setUploadError(null), 6000);
  };

  const addFiles = (files: File[]) => {
    if (!files.length) return;
    const valid: File[] = [];
    const problems: string[] = [];
    let total = currentTotalSize;
    for (const file of files) {
      if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(getFileExtension(file.name))) {
        problems.push(`${file.name} is not an allowed file type`);
      } else if (file.size > MAX_FILE_SIZE) {
        problems.push(`${file.name} is larger than ${MAX_FILE_SIZE / MB} MB`);
      } else if (total + file.size > MAX_TOTAL_ATTACHMENTS_SIZE) {
        problems.push(`${file.name} would take the total over ${MAX_TOTAL_ATTACHMENTS_SIZE / MB} MB`);
      } else {
        valid.push(file);
        total += file.size;
      }
    }
    if (problems.length) showError(problems.join(' · '));
    else setUploadError(null);
    if (valid.length) setAttachments((prev) => [...prev, ...valid]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  // Drag files anywhere over the dialog.
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
  const onDragEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current++;
    setDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDragOver = (e: DragEvent) => {
    if (hasFiles(e)) e.preventDefault();
  };
  const onDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const clearAll = () => {
    reset();
    setAttachments([]);
    setShowCc(false);
    setShowBcc(false);
    setUploadError(null);
    setUploadProgress(null);
    setTemplateId('');
    setBodyEdited(false);
    setSeed((s) => ({ key: s.key + 1, html: '' }));
  };

  const onSubmit = async (data: FormData) => {
    if (currentTotalSize > MAX_TOTAL_ATTACHMENTS_SIZE) {
      dispatchShowToast({ type: 'danger', message: `Total attachments size exceeds ${MAX_TOTAL_ATTACHMENTS_SIZE / MB}MB limit` });
      return;
    }

    setLoading(true);
    setUploadProgress(attachments.length ? 0 : null);

    try {
      const formData = new FormData();
      formData.append('toMail', data.toMail);
      if (data.ccMail) formData.append('ccMail', data.ccMail);
      if (data.bccMail) formData.append('bccMail', data.bccMail);
      formData.append('subject', data.subject);
      formData.append('body', data.body || '');
      formData.append('mailType', 'manual');
      if (replyTo?.id) formData.append('parentMailId', replyTo.id.toString());
      attachments.forEach((file) => formData.append('attachments', file, file.name));

      await sendMail(formData, (progress) => {
        if (attachments.length) setUploadProgress(progress);
      });

      dispatchShowToast({ type: 'success', message: 'Mail sent successfully' });
      clearAll();
      onSent();
      onClose();
    } catch (error: any) {
      console.error('Send mail error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send mail';
      dispatchShowToast({ type: 'danger', message: errorMessage });
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // Something the person typed or attached would be lost by closing.
  const hasDraft = isDirty || bodyEdited || attachments.length > 0;

  const discard = () => {
    setConfirmDiscard(false);
    clearAll();
    onClose();
  };

  const requestClose = () => {
    if (loading) return;
    if (hasDraft) setConfirmDiscard(true);
    else discard();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!loading) handleSubmit(onSubmit)();
    }
  };

  const isReply = !!replyTo?.id || !!replyTo?.fromMail;
  const title = isReply ? 'Reply' : template ? template.name : 'New message';

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* Title bar */}
          <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isReply ? <Reply className="size-4" /> : <Send className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-semibold">{title}</DialogTitle>
              <DialogDescription className="sr-only">Write and send an email</DialogDescription>
            </div>
            {templates.length > 0 && (
              <Select value={templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="hidden h-8 w-44 cursor-pointer bg-card sm:flex" aria-label="Use a template">
                  <LayoutTemplate className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()} className="cursor-pointer">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onKeyDown} noValidate className="flex min-h-0 flex-1 flex-col">
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept={ATTACHMENT_ACCEPT} />

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Template picker on phones (the title bar has no room). */}
              {templates.length > 0 && (
                <div className="border-b border-border px-4 py-2 sm:hidden">
                  <Select value={templateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-9 w-full cursor-pointer" aria-label="Use a template">
                      <LayoutTemplate className="size-4 text-muted-foreground" />
                      <SelectValue placeholder="Use a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()} className="cursor-pointer">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <EnvelopeRow label="To" htmlFor="compose-to" error={errors.toMail?.message}>
                <input
                  id="compose-to"
                  type="email"
                  autoComplete="email"
                  placeholder="recipient@example.com"
                  aria-invalid={!!errors.toMail}
                  autoFocus={!replyTo?.toMail}
                  {...register('toMail')}
                  className={bareInput}
                />
                <div className="flex shrink-0 gap-0.5 text-xs">
                  {!showCc && (
                    <button type="button" onClick={() => setShowCc(true)} className="rounded px-1.5 py-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button type="button" onClick={() => setShowBcc(true)} className="rounded px-1.5 py-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                      Bcc
                    </button>
                  )}
                </div>
              </EnvelopeRow>

              {showCc && (
                <EnvelopeRow label="Cc" htmlFor="compose-cc">
                  <input id="compose-cc" placeholder="cc@example.com" autoFocus {...register('ccMail')} className={bareInput} />
                  <button
                    type="button"
                    aria-label="Remove Cc"
                    onClick={() => {
                      setShowCc(false);
                      setValue('ccMail', '');
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </EnvelopeRow>
              )}
              {showBcc && (
                <EnvelopeRow label="Bcc" htmlFor="compose-bcc">
                  <input id="compose-bcc" placeholder="bcc@example.com" autoFocus {...register('bccMail')} className={bareInput} />
                  <button
                    type="button"
                    aria-label="Remove Bcc"
                    onClick={() => {
                      setShowBcc(false);
                      setValue('bccMail', '');
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </EnvelopeRow>
              )}

              <EnvelopeRow label="Subject" htmlFor="compose-subject" error={errors.subject?.message}>
                <input
                  id="compose-subject"
                  placeholder="What's this about?"
                  aria-invalid={!!errors.subject}
                  autoFocus={!!replyTo?.toMail}
                  {...register('subject')}
                  className={cn(bareInput, 'font-medium')}
                />
              </EnvelopeRow>

              <RichTextEditor
                key={seed.key}
                value={seed.html}
                onChange={(value) => {
                  setValue('body', value);
                  setBodyEdited(true);
                }}
                placeholder="Write your message…"
                height="220px"
                bare
                className="px-4 sm:px-5"
              />

              {/* Attachments */}
              <AnimatePresence initial={false}>
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div role="alert" className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 sm:mx-5">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <span className="flex-1 text-sm text-destructive">{uploadError}</span>
                      <button type="button" aria-label="Dismiss" onClick={() => setUploadError(null)} className="text-destructive/70 hover:text-destructive">
                        <X className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {attachments.length > 0 && (
                <div className="border-t border-border px-4 py-3 sm:px-5">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground">
                      {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground tabular-nums">
                      <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
                        <span
                          className={cn('block h-full rounded-full transition-[width] duration-300', totalSizePercent > 90 ? 'bg-destructive' : 'bg-primary')}
                          style={{ width: `${Math.min(totalSizePercent, 100)}%` }}
                        />
                      </span>
                      {formatFileSize(currentTotalSize)} / {MAX_TOTAL_ATTACHMENTS_SIZE / MB} MB
                      <button type="button" onClick={() => setAttachments([])} className="rounded px-1.5 py-0.5 hover:bg-accent hover:text-foreground">
                        Clear all
                      </button>
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {attachments.map((file, index) => {
                      const { icon: Icon, tone } = fileKind(file);
                      return (
                        <li key={`${file.name}-${index}`} className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-card p-2 pr-1.5">
                          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', tone)}>
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            aria-label={`Remove ${file.name}`}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="relative border-t border-border bg-card px-4 py-3 sm:px-5">
              {uploadProgress !== null && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-muted" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                  <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={loading} className="min-w-28">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {loading ? (uploadProgress !== null ? `Sending ${uploadProgress}%` : 'Sending…') : 'Send'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || currentTotalSize >= MAX_TOTAL_ATTACHMENTS_SIZE}
                  aria-label="Attach files"
                  title="Attach files"
                >
                  <Paperclip className="size-4" />
                </Button>
                <span className="hidden text-xs text-muted-foreground md:inline">
                  <kbd className="rounded border border-border bg-muted px-1 font-sans">Ctrl</kbd> +{' '}
                  <kbd className="rounded border border-border bg-muted px-1 font-sans">Enter</kbd> to send · drop files to attach
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={requestClose}
                  disabled={loading}
                  aria-label="Discard draft"
                  title="Discard draft"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Drop target over the whole dialog */}
          <AnimatePresence>
            {dragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-card/90 text-primary backdrop-blur-sm"
              >
                <Upload className="size-8" />
                <p className="text-sm font-medium">Drop files to attach</p>
                <p className="text-xs text-muted-foreground">Up to {MAX_FILE_SIZE / MB} MB each, {MAX_TOTAL_ATTACHMENTS_SIZE / MB} MB in total</p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={discard}
        title="Discard this draft?"
        variant="warning"
        confirmLabel="Discard"
      >
        <p>What you wrote and attached will be lost.</p>
      </ConfirmDialog>
    </>
  );
}
