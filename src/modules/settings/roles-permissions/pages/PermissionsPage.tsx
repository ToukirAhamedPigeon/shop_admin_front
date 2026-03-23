import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import Permissions from '../components/Permissions'

export default function PermissionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.permissions.title"
        defaultTitle="Permissions"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.permissions.title',
            defaultLabel: 'Permissions',
            href: '/settings/permissions',
          },
        ]}
        className="pb-0"
      />

      <Permissions />
    </div>
  )
}