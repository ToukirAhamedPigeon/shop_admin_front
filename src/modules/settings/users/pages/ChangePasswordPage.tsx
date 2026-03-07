import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import ChangePassword from './../components/ChangePassword'

export default function ChangePasswordPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.changePassword.title"
        defaultTitle="Change Password"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.changePassword.title',
            defaultLabel: 'Change Password',
            href: '/settings/change-password',
          },
        ]}
        className="pb-0"
      />

      <ChangePassword/>
    </div>
  )
}
