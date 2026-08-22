// src/modules/options/components/AddOption.tsx
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
import { PlusCircle, Layers, AlertCircle } from 'lucide-react';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="rounded-xl bg-card border border-border shadow-sm p-6 mb-6">
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Add New Option')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('You can add multiple options by separating names with')} "=" (
                  <span className="text-primary font-medium">Admin=Editor=Viewer</span>)
                </p>
              </div>
            </div>

            {/* Main Form Fields */}
            <div className="grid grid-cols-1 gap-5">
              <BasicInput
                id="names"
                label="Option Names"
                isRequired
                placeholder="Enter option names separated by '=' (e.g., Admin=Editor=Viewer)"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  label="Status"
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
            </div>

            {/* Info Box */}
            <div className="mt-4 p-4 rounded-lg bg-muted border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">
                    {t('Multiple Options Creation')}
                  </p>
                  <p>
                    {t('You can create multiple options at once by separating the names with an equals sign (=).')}
                    <br />
                    <span className="text-foreground font-mono text-xs mt-1 block">
                      {t('Example')}: "Admin=Editor=Viewer" {t('will create 3 options')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitLoading}
              >
                {t('Reset Form')}
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('Creating')}...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {t('Create Option(s)')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}