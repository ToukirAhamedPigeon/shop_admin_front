// src/modules/settings/app-settings/components/ImageDrop.tsx
import { useDropzone } from 'react-dropzone';
import { ImageUp, Trash2, RefreshCw } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

/** Drop zone that becomes a preview with Replace / Remove once an image is set. */
export function ImageDrop({
  label,
  image,
  onDrop,
  onClear,
  hint,
  fit = 'cover',
  accept = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  height = 'h-36',
}: {
  label: string;
  image: string | null;
  onDrop: (files: File[]) => void;
  onClear: () => void;
  hint?: string;
  fit?: 'cover' | 'contain';
  accept?: string[];
  height?: string;
}) {
  const { t } = useTranslations();
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': accept },
    maxFiles: 1,
    multiple: false,
    noClick: !!image,
    noKeyboard: !!image,
  });

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{t(label)}</p>
      <div
        {...getRootProps()}
        className={cn(
          'group relative overflow-hidden rounded-xl border transition-colors',
          height,
          image ? 'border-border' : 'cursor-pointer border-2 border-dashed',
          !image && (isDragActive ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50 hover:bg-accent/40')
        )}
        aria-label={image ? undefined : t(label)}
      >
        <input {...getInputProps()} />
        {image ? (
          <>
            <img
              src={image}
              alt=""
              className={cn('size-full', fit === 'cover' ? 'object-cover' : 'bg-muted/40 object-contain p-4')}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
              <button
                type="button"
                onClick={open}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-900 shadow-sm outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw className="size-3.5" />
                {t('Replace')}
              </button>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-white shadow-sm outline-none transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="size-3.5" />
                {t('Remove')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 px-4 text-center">
            <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImageUp className="size-5" />
            </span>
            <p className="text-sm text-foreground/80">{isDragActive ? t('Drop the image here') : t('Drag an image here, or click to choose')}</p>
            {hint && <p className="text-xs text-muted-foreground">{t(hint)}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
