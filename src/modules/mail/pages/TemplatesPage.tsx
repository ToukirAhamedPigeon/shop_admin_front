// src/modules/mail/pages/TemplatesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FileText, Mail, Calendar, User, Globe, Lock } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api';
import type { MailTemplate } from '../types';
import { can } from '@/lib/authCheck';
import { dispatchShowToast } from '@/lib/dispatch';
import Loader from '@/components/custom/Loader';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import RichTextEditor from '@/components/custom/RichTextEditor';
import { format } from 'date-fns';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

export default function TemplatesPage() {
  const { t } = useTranslations();
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    description: '',
    isGlobal: false,
  });
  const [validationErrors, setValidationErrors] = useState<{ name?: string; subject?: string }>({});

  const hasCreatePermission = can(['create-admin-mail-templates']);
  const hasEditPermission = can(['update-admin-mail-templates']);
  const hasDeletePermission = can(['delete-admin-mail-templates']);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTemplates({ page: 1, limit: 100, includeGlobal: true });
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleOpenDialog = (template?: MailTemplate) => {
    setValidationErrors({});
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        description: template.description || '',
        isGlobal: template.isGlobal,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        body: '',
        description: '',
        isGlobal: false,
      });
    }
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; subject?: string } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Template name is required';
    }
    if (!formData.subject.trim()) {
      errors.subject = 'Template subject is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validate before sending
    if (!validateForm()) {
      dispatchShowToast({ type: 'danger', message: 'Please fix validation errors' });
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
        dispatchShowToast({ type: 'success', message: 'Template updated successfully' });
      } else {
        await createTemplate(formData);
        dispatchShowToast({ type: 'success', message: 'Template created successfully' });
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      dispatchShowToast({ 
        type: 'danger', 
        message: error.response?.data?.message || 'Failed to save template' 
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTemplate(deletingId);
      dispatchShowToast({ type: 'success', message: 'Template deleted successfully' });
      loadTemplates();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to delete template' });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const globalCount = templates.filter(t => t.isGlobal).length;
  const personalCount = templates.filter(t => !t.isGlobal).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader type="circular" size={48} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <Breadcrumb
          title="common.mail.templates.title"
          showTitle={true}
          items={[
            { label: "common.mail.title", href: "/mail" },
            { label: "common.mail.templates.title", href: "/mail/templates" },
          ]}
          className="pb-0"
        />
        {hasCreatePermission && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-indigo-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </motion.div>
        )}
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <GlassCard variant="primary" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Templates</p>
              <p className="text-2xl font-bold mt-1">{templates.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100/50 dark:bg-blue-900/30">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="accent" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Global Templates</p>
              <p className="text-2xl font-bold mt-1">{globalCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30">
              <Globe className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="secondary" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personal Templates</p>
              <p className="text-2xl font-bold mt-1">{personalCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100/50 dark:bg-purple-900/30">
              <Lock className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Templates Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard variant="default" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-20 text-center">Global</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="w-32">Created At</TableHead>
                  <TableHead className="w-24 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Mail className="w-12 h-12 text-gray-300" />
                        <p>No templates found. Create your first template!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template, index) => (
                    <motion.tr
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <TableCell>
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          template.isGlobal 
                            ? "bg-emerald-100/50 dark:bg-emerald-900/30" 
                            : "bg-purple-100/50 dark:bg-purple-900/30"
                        )}>
                          {template.isGlobal ? (
                            <Globe className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-purple-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p>{template.name}</p>
                          {template.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{template.subject}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          template.isGlobal
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        )}>
                          {template.isGlobal ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{template.createdByName || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{format(new Date(template.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {hasEditPermission && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleOpenDialog(template)}
                              className="p-2 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group"
                            >
                              <Edit className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                            </motion.button>
                          )}
                          {hasDeletePermission && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setDeletingId(template.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-2 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors cursor-pointer group"
                            >
                              <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                            </motion.button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      </motion.div>

      {/* Template Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <GlassCard variant="primary" padding="md" className="border-0 shadow-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-semibold">Template Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) setValidationErrors({ ...validationErrors, name: undefined });
                  }}
                  placeholder="e.g., Welcome Email, Order Confirmation"
                  className={cn("mt-1", validationErrors.name && "border-red-500")}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold">Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({ ...formData, subject: e.target.value });
                    if (validationErrors.subject) setValidationErrors({ ...validationErrors, subject: undefined });
                  }}
                  placeholder="Email subject"
                  className={cn("mt-1", validationErrors.subject && "border-red-500")}
                />
                {validationErrors.subject && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.subject}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold">Email Body *</Label>
                <RichTextEditor
                  value={formData.body}
                  onChange={(value) => setFormData({ ...formData, body: value })}
                  placeholder="Template content..."
                  height="400px"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of when to use this template"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                <Checkbox
                  id="isGlobal"
                  checked={formData.isGlobal}
                  onCheckedChange={(checked) => setFormData({ ...formData, isGlobal: !!checked })}
                  className="cursor-pointer"
                />
                <Label htmlFor="isGlobal" className="cursor-pointer font-medium">
                  Make this template available to all users (Global)
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-500 to-purple-600">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </GlassCard>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Template"
        variant="destructive"
        confirmLabel="Delete"
      >
        <p>Are you sure you want to delete this template? This action cannot be undone.</p>
      </ConfirmDialog>
    </motion.div>
  );
}