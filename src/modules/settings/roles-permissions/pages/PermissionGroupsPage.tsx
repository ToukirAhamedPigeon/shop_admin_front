import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import PermissionGroups from '../components/PermissionGroups'

export default function PermissionGroupsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.permission_groups.title"
        defaultTitle="Permission Groups"
        showTitle
        items={[
          { label: 'common.settings.title', defaultLabel: 'Settings', href: '/settings' },
          { label: 'common.permission_groups.title', defaultLabel: 'Permission Groups', href: '/settings/permission-groups' },
        ]}
        className="pb-0"
      />
      <PermissionGroups />
    </div>
  )
}
