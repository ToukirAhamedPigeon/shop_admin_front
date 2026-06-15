// src/modules/options/components/EditOption.tsx
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
import { Edit3, Layers, GitBranch, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';

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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

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
        
        {/* Colored accent line at top - Warning/Orange theme */}
        <div
          className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#f59e0b' : '#f97316'}, ${isDarkMode ? '#d97706' : '#ea580c'}, transparent)`,
          }}
        />

        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <Edit3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  {t('Edit Option')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('Update option details including parent relationship and status')}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>{t('Edit Mode')}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('Note: Changing parent relationships may affect how options are displayed in dropdowns')}
              </p>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-5">
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
                  value={formValues.hasChild}
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
                  value={formValues.isActive}
                  model="Option"
                />
              </div>
            </div>

            {/* Parent Warning Note */}
            {formValues.parentId && formValues.hasChild === 'true' && (
              <div className="mt-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Layers className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('This option has children and is also a child of another option. This creates a hierarchy relationship.')}
                  </p>
                </div>
              </div>
            )}

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
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('Updating')}...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('Update Option')}
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