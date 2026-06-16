// src/modules/mail/components/ComposeMail.tsx
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Paperclip, Send, X, File, Image, FileText, FileSpreadsheet, FileAudio, FileVideo, Archive, AlertCircle } from 'lucide-react';
import { sendMail, getTemplates } from '../api';
import { dispatchShowToast } from '@/lib/dispatch';
import RichTextEditor from '@/components/custom/RichTextEditor';
import type { MailTemplate } from '../types';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/custom/GlassCard';

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
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENTS_SIZE = 50 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/html', 'text/xml', 'application/rtf',
  'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac',
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
];

export default function ComposeMail({ open, onClose, onSent, replyTo }: ComposeMailProps) {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [templateBody, setTemplateBody] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { toMail: '', ccMail: '', bccMail: '', subject: '', body: '' },
  });

  const bodyValue = watch('body');

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await getTemplates({ page: 1, limit: 50, includeGlobal: true });
        setTemplates(response.data.templates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    if (open) loadTemplates();
  }, [open]);

  useEffect(() => {
    if (replyTo && open) {
      if (replyTo.toMail) setValue('toMail', replyTo.toMail);
      if (replyTo.subject) {
        setValue('subject', replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      }
      if (replyTo.fromMail) {
        setValue('body', `<br/><br/><p>--- Original Message ---<br/>From: ${replyTo.fromMail}<br/>Subject: ${replyTo.subject}</p>`);
      }
    }
  }, [replyTo, open, setValue]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setValue('subject', template.subject);
      setValue('body', template.body || '');
      setTemplateBody(template.body || '');
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (type.startsWith('video/')) return <FileVideo className="w-4 h-4 text-purple-500" />;
    if (type.startsWith('audio/')) return <FileAudio className="w-4 h-4 text-green-500" />;
    if (type === 'application/pdf' || extension === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (type.includes('spreadsheet') || extension === 'xlsx' || extension === 'xls') return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    if (type.includes('word') || extension === 'docx' || extension === 'doc') return <FileText className="w-4 h-4 text-blue-600" />;
    if (type.includes('presentation') || extension === 'pptx' || extension === 'ppt') return <FileSpreadsheet className="w-4 h-4 text-orange-500" />;
    if (type.includes('zip') || type.includes('rar') || extension === 'zip' || extension === 'rar' || extension === '7z') return <Archive className="w-4 h-4 text-yellow-600" />;
    if (type === 'text/plain' || extension === 'txt') return <FileText className="w-4 h-4 text-gray-500" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  const getCurrentTotalSize = (): number => {
    return attachments.reduce((sum, file) => sum + file.size, 0);
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `${file.name} exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` 
      };
    }
    
    const currentTotal = getCurrentTotalSize();
    if (currentTotal + file.size > MAX_TOTAL_ATTACHMENTS_SIZE) {
      return {
        valid: false,
        error: `Total attachments size would exceed ${MAX_TOTAL_ATTACHMENTS_SIZE / (1024 * 1024)}MB limit`
      };
    }
    
    return { valid: true };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadError(null);
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      for (const file of filesArray) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else if (validation.error) {
          errors.push(validation.error);
        }
      }
      
      if (errors.length > 0) {
        setUploadError(errors.join(', '));
        setTimeout(() => setUploadError(null), 5000);
      }
      
      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const onSubmit = async (data: FormData) => {
    const totalSize = getCurrentTotalSize();
    if (totalSize > MAX_TOTAL_ATTACHMENTS_SIZE) {
      dispatchShowToast({ 
        type: 'danger', 
        message: `Total attachments size exceeds ${MAX_TOTAL_ATTACHMENTS_SIZE / (1024 * 1024)}MB limit` 
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('toMail', data.toMail);
      if (data.ccMail) formData.append('ccMail', data.ccMail);
      if (data.bccMail) formData.append('bccMail', data.bccMail);
      formData.append('subject', data.subject);
      formData.append('body', data.body || '');
      formData.append('mailType', 'manual');
      if (replyTo?.id) formData.append('parentMailId', replyTo.id.toString());
      
      attachments.forEach(file => {
        formData.append('attachments', file, file.name);
      });
      
      const response = await sendMail(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      dispatchShowToast({ type: 'success', message: 'Mail sent successfully' });
      reset();
      setAttachments([]);
      setShowCc(false);
      setShowBcc(false);
      setUploadProgress(null);
      setTemplateBody('');
      onSent();
      onClose();
    } catch (error: any) {
      console.error('Send mail error:', error);
      
      let errorMessage = 'Failed to send mail';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatchShowToast({ type: 'danger', message: errorMessage });
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    reset();
    setAttachments([]);
    setShowCc(false);
    setShowBcc(false);
    setUploadError(null);
    setTemplateBody('');
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentTotalSize = getCurrentTotalSize();
  const totalSizePercent = (currentTotalSize / MAX_TOTAL_ATTACHMENTS_SIZE) * 100;

  return (
    <Dialog open={open} onOpenChange={handleDiscard}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <GlassCard variant="primary" padding="lg" className="border-0 shadow-none rounded-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              New Message
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="*/*"
            />

            {templates.length > 0 && (
              <div>
                <Label className="cursor-default">Use Template</Label>
                <Select onValueChange={handleTemplateChange}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()} className="cursor-pointer">
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="cursor-default">To *</Label>
              <Input 
                {...register('toMail')} 
                placeholder="recipient@example.com" 
                className={cn(errors.toMail ? 'border-red-500' : '', 'cursor-text')}
              />
              {errors.toMail && <p className="text-red-500 text-xs mt-1">{errors.toMail.message}</p>}
            </div>

            <div className="flex gap-2 text-sm">
              <button 
                type="button" 
                onClick={() => setShowCc(!showCc)} 
                className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                Cc
              </button>
              <button 
                type="button" 
                onClick={() => setShowBcc(!showBcc)} 
                className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                Bcc
              </button>
            </div>

            {showCc && (
              <div>
                <Label className="cursor-default">Cc</Label>
                <Input {...register('ccMail')} placeholder="cc@example.com" className="cursor-text" />
              </div>
            )}

            {showBcc && (
              <div>
                <Label className="cursor-default">Bcc</Label>
                <Input {...register('bccMail')} placeholder="bcc@example.com" className="cursor-text" />
              </div>
            )}

            <div>
              <Label className="cursor-default">Subject *</Label>
              <Input 
                {...register('subject')} 
                placeholder="Subject" 
                className={cn(errors.subject ? 'border-red-500' : '', 'cursor-text')}
              />
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
            </div>

            <div className="w-full">
              <Label className="cursor-default">Message</Label>
              <div className="w-full border rounded-lg overflow-hidden">
                <RichTextEditor
                  key={templateBody || 'default'}
                  value={bodyValue || templateBody || ''}
                  onChange={(value) => setValue('body', value)}
                  placeholder="Write your message here..."
                  height="150px"
                  className="w-full"
                />
              </div>
            </div>

            {uploadError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-600 dark:text-red-400 text-sm">{uploadError}</span>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium cursor-default">Attachments ({attachments.length})</div>
                  <div className="text-xs text-gray-500">
                    {(currentTotalSize / (1024 * 1024)).toFixed(1)} MB / {(MAX_TOTAL_ATTACHMENTS_SIZE / (1024 * 1024)).toFixed(0)} MB
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      totalSizePercent > 90 ? "bg-red-500" : "bg-blue-500"
                    )}
                    style={{ width: `${Math.min(totalSizePercent, 100)}%` }}
                  />
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 mx-2 flex-shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(index)} 
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors flex-shrink-0"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAttachClick}
                  className="cursor-pointer"
                  disabled={currentTotalSize >= MAX_TOTAL_ATTACHMENTS_SIZE}
                >
                  <Paperclip className="w-4 h-4 mr-1" />
                  Attach Files
                </Button>
                {attachments.length > 0 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setAttachments([])}
                    className="cursor-pointer"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleDiscard} className="cursor-pointer">
                  Discard
                </Button>
                <Button type="submit" disabled={loading} className="cursor-pointer">
                  <Send className="w-4 h-4 mr-1" />
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
            {uploadProgress !== null && (
              <div className="w-full mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Uploading: {uploadProgress}%</p>
              </div>
            )}
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}