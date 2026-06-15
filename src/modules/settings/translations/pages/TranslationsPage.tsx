// src/modules/settings/translations/pages/TranslationsPage.tsx
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import Translations from '../components/Translations'
import { motion } from 'framer-motion'

export default function TranslationsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4"
    >
      <Breadcrumb
        title="common.translations.title"
        defaultTitle="Translations"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.translations.title',
            defaultLabel: 'Translations',
            href: '/settings/translations',
          },
        ]}
        className="pb-0"
      />

      <Translations />
    </motion.div>
  )
}