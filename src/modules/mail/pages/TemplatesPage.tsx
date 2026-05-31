// src/modules/mail/pages/TemplatesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

  const handleSave = async () => {
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
      dispatchShowToast({ type: 'danger', message: error.response?.data?.message || 'Failed to save template' });
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
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-20">Global</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="w-32">Created At</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  No templates found. Create your first template!
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell>{template.isGlobal ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{template.createdByName || '-'}</TableCell>
                  <TableCell>{format(new Date(template.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {hasEditPermission && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasDeletePermission && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingId(template.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Template Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome Email, Order Confirmation"
              />
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Body *</Label>
              <RichTextEditor
                value={formData.body}
                onChange={(value) => setFormData({ ...formData, body: value })}
                placeholder="Template content..."
                height="400px"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of when to use this template"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isGlobal"
                checked={formData.isGlobal}
                onCheckedChange={(checked) => setFormData({ ...formData, isGlobal: !!checked })}
              />
              <Label htmlFor="isGlobal" className="cursor-pointer">
                Make this template available to all users (Global)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
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