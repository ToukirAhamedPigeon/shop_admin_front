import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import { dispatchShowToast } from '@/lib/dispatch';
import Loader from '@/components/custom/Loader';
import { getOptionForEdit, updateOption, getParentOptions } from '../api';
import type { IOption } from '@/types/option';

const schema = z.object({
  name: z.string().min(1, 'Option name is required'),
  parentId: z.string().nullable().optional(),
  hasChild: z.string().min(1, 'Has Child selection is required'),
  isActive: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditOptionProps {
  optionId: string;
  fetchData: () => Promise<void>;
  onClose: () => void;
}

export default function EditOption({ optionId, fetchData, onClose }: EditOptionProps) {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState<{ value: string; label: string }[]>([]);
  const hasLoaded = useRef(false);

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
      name: '',
      parentId: null,
      hasChild: 'false',
      isActive: 'true',
    }
  });

  const formValues = watch();

  // Fetch parent options for dropdown
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const parents = await getParentOptions();
        // Filter out the current option from being its own parent
        const filteredParents = parents.filter((p: any) => p.value !== optionId);
        // Add "No Parent" option at the beginning
        const optionsWithNoParent = [
          { value: '', label: 'No Parent' },
          ...filteredParents.map((p: any) => ({ value: p.value, label: p.label }))
        ];
        setParentOptions(optionsWithNoParent);
      } catch (error) {
        console.error('Failed to fetch parent options:', error);
        // Even if fetch fails, still provide "No Parent" option
        setParentOptions([{ value: '', label: 'No Parent' }]);
      }
    };
    fetchParents();
  }, [optionId]);

  useEffect(() => {
    if (!hasLoaded.current && optionId) {
      hasLoaded.current = true;
      loadOption();
    }
  }, [optionId]);

  const loadOption = async () => {
    try {
      setLoading(true);
      const option: IOption = await getOptionForEdit(optionId);
      
      const formData = {
        name: option.name,
        parentId: option.parentId || '', // Convert null to empty string for display
        hasChild: option.hasChild ? 'true' : 'false',
        isActive: option.isActive ? 'true' : 'false',
      };
      
      reset(formData);
    } catch (error) {
      console.error('Failed to load option:', error);
      dispatchShowToast({
        type: 'danger',
        message: t('Failed to load option data')
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);
    try {
      // Convert empty string to null for parentId
      const parentId = data.parentId === '' ? null : data.parentId;
      
      await updateOption(optionId, {
        name: data.name,
        parentId: parentId,
        hasChild: data.hasChild,
        isActive: data.isActive
      });

      dispatchShowToast({
        type: 'success',
        message: t('Option updated successfully')
      });

      await fetchData();
      onClose();
    } catch (error: any) {
      dispatchShowToast({
        type: 'danger',
        message: error.response?.data?.message || t('Failed to update option')
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const option: IOption = await getOptionForEdit(optionId);
      const formData = {
        name: option.name,
        parentId: option.parentId || '', // Convert null to empty string for display
        hasChild: option.hasChild ? 'true' : 'false',
        isActive: option.isActive ? 'true' : 'false',
      };
      reset(formData);
    } catch (error) {
      console.error('Failed to reset form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader type="circular" size={48} />
      </div>
    );
  }

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
              {t('Edit Option Information')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('Update option details')}
            </span>
          </div>

          <BasicInput
            id="name"
            label="Option Name"
            isRequired
            placeholder="Option name"
            register={register('name')}
            error={errors.name}
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
            value={formValues.parentId || ''}
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
            value={formValues.hasChild}
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
            value={formValues.isActive}
            model="Option"
          />
        </div>

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="bg-amber-600 text-white shadow hover:bg-amber-700" disabled={submitLoading}>
            {submitLoading ? t('Updating') + '...' : t('Update Option')}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}