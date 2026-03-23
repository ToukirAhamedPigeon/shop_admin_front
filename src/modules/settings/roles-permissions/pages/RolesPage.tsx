import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import Roles from '../components/Roles'

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.roles.title"
        defaultTitle="Roles"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.roles.title',
            defaultLabel: 'Roles',
            href: '/settings/roles',
          },
        ]}
        className="pb-0"
      />

      <Roles />
    </div>
  )
}