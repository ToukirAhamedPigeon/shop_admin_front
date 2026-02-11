import { useCallback, useState, useEffect } from 'react';
import type{
  FieldValues,
  UseFormSetValue,
  UseFormSetError,
  Path,
  PathValue,
} from 'react-hook-form';

export function useProfilePicture<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  setError: UseFormSetError<T>,
  fieldName: Path<T>,
  initialPreview?: File | string // Accepts File or URL string
) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  // Handle preview setup on mount or when initialPreview changes
  useEffect(() => {
    if (!initialPreview) {
      setPreview(null);
      return;
    }

    if (typeof initialPreview === 'string') {
      setPreview(initialPreview);
    } else if (initialPreview instanceof File) {
      const objectUrl = URL.createObjectURL(initialPreview);
      setPreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [initialPreview]);

  const clearImage = useCallback(() => {
    setValue(fieldName, undefined as PathValue<T, Path<T>>);
    setPreview(null);
    setError(fieldName, { message: '' });
    setIsImageDeleted(true);
  }, [setValue, setError, fieldName]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setValue(fieldName, undefined as PathValue<T, Path<T>>);
      setPreview(null);
      setError(fieldName, { message: '' });

      const file = acceptedFiles[0];
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (
        fileRejections.length > 0 ||
        !file ||
        !validTypes.includes(file.type) ||
        file.size > maxSize
      ) {
        setError(fieldName, {
          type: 'manual',
          message: 'File must be a valid image and less than 5MB.',
        });
        return;
      }

      setValue(fieldName, file as PathValue<T, Path<T>>);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setIsImageDeleted(false);
    },
    [setValue, setError, fieldName]
  );

  return {
    preview,
    isImageDeleted,
    clearImage,
    onDrop,
    setIsImageDeleted,
    setPreview,
  };
}
