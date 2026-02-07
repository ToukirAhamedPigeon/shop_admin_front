import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import Users from './../components/Users'

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.users.title"
        defaultTitle="Users"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.users.title',
            defaultLabel: 'Users',
            href: '/settings/users',
          },
        ]}
        className="pb-0"
      />

      <Users />
    </div>
  )
}
