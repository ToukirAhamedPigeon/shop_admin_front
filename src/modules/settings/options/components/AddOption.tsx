import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import { dispatchShowToast } from '@/lib/dispatch';
import { createOption, getParentOptions } from '../api';

const schema = z.object({
  names: z.string().min(1, 'Option name(s) are required'),
  parentId: z.string().nullable().optional(),
  hasChild: z.string().min(1, 'Has Child selection is required'),
  isActive: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddOptionProps {
  fetchData: () => Promise<void>;
  onClose: () => void;
}

export default function AddOption({ fetchData, onClose }: AddOptionProps) {
  const { t } = useTranslations();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch parent options for dropdown
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const parents = await getParentOptions();
        // Add "No Parent" option at the beginning
        const optionsWithNoParent = [
          { value: '', label: 'No Parent' },
          ...parents.map((p: any) => ({ value: p.value, label: p.label }))
        ];
        setParentOptions(optionsWithNoParent);
      } catch (error) {
        console.error('Failed to fetch parent options:', error);
        // Even if fetch fails, still provide "No Parent" option
        setParentOptions([{ value: '', label: 'No Parent' }]);
      }
    };
    fetchParents();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      names: '',
      parentId: null,
      hasChild: 'false',
      isActive: 'true',
    }
  });

  const selectedHasChild = watch('hasChild');
  const selectedIsActive = watch('isActive');
  const selectedParentId = watch('parentId');

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);
    try {
      // Convert empty string to null for parentId
      const parentId = data.parentId === '' ? null : data.parentId;
      
      await createOption({
        names: data.names,
        parentId: parentId,
        hasChild: data.hasChild,
        isActive: data.isActive
      });

      dispatchShowToast({
        type: 'success',
        message: t('Option(s) created successfully')
      });

      reset();
      await fetchData();
      onClose();
    } catch (error: any) {
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to create option(s)')
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    reset({
      names: '',
      parentId: null,
      hasChild: 'false',
      isActive: 'true',
    });
  };

  const HAS_CHILD_OPTIONS = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' }
  ];

  const ACTIVE_OPTIONS = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {t('Provide Option Information')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('You can add multiple options by separating names with "=" (e.g., "Admin=Editor=Viewer")')}
            </span>
          </div>

          <BasicInput
            id="names"
            label="Option Names"
            isRequired
            placeholder="Enter option names separated by '='"
            register={register('names')}
            error={errors.names}
            model="Option"
          />

          <CustomSelect<FormData>
            id="parentId"
            label="Parent Option"
            name="parentId"
            options={parentOptions}
            optionValueKey="value"
            optionLabelKeys={['label']}
            multiple={false}
            setValue={setValue}
            model="Option"
            value={selectedParentId === null ? '' : selectedParentId || undefined}
            placeholder="Select Parent Option"
            error={errors.parentId}
          />

          <CustomSelect<FormData>
            id="hasChild"
            label="Has Child?"
            name="hasChild"
            placeholder="Select if this option can have children"
            isRequired
            options={HAS_CHILD_OPTIONS}
            error={errors.hasChild}
            setValue={setValue}
            value={selectedHasChild}
            model="Option"
          />

          <CustomSelect<FormData>
            id="isActive"
            label="Is Active?"
            name="isActive"
            placeholder="Select Current Status"
            isRequired
            options={ACTIVE_OPTIONS}
            error={errors.isActive}
            setValue={setValue}
            value={selectedIsActive}
            model="Option"
          />
        </div>

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="btn-success-gradient" disabled={submitLoading}>
            {submitLoading ? t('Creating') + '...' : t('Create Option(s)')}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}