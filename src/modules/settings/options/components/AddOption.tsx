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
import { PlusCircle, Layers, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';

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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

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
      <div
        className="relative rounded-2xl backdrop-blur-xl transition-all duration-300 p-6 mb-6"
        style={{
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.4)'
            : 'rgba(255, 255, 255, 0.55)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {/* Animated gradient border overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(100,120,255,0.08), rgba(180,100,255,0.05))',
          }}
        />
        
        {/* Colored accent line at top */}
        <div
          className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#6366f1' : '#818cf8'}, ${isDarkMode ? '#a855f7' : '#c084fc'}, transparent)`,
          }}
        />

        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  {t('Add New Option')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('You can add multiple options by separating names with')} "=" (
                  <span className="text-purple-500 font-medium">Admin=Editor=Viewer</span>)
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
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                    {t('Multiple Options Creation')}
                  </p>
                  <p>
                    {t('You can create multiple options at once by separating the names with an equals sign (=).')}
                    <br />
                    <span className="text-purple-600 dark:text-purple-400 font-mono text-xs mt-1 block">
                      {t('Example')}: "Admin=Editor=Viewer" {t('will create 3 options')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset} 
                disabled={submitLoading}
                className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                {t('Reset Form')}
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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