import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import Translations from '../components/Translations'

export default function TranslationsPage() {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  )
}