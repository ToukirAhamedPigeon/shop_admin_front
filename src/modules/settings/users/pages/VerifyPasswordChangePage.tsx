import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import VerifyPasswordChange from './../components/VerifyPasswordChange'
import ChangePassword from '../components/ChangePassword'

export default function VerifyPasswordChangePage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.verifyPasswordChange.title"
        defaultTitle="Verify Password Change"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.verifyPasswordChange.title',
            defaultLabel: 'Verify Password Change',
            href: '/settings/verify-password-change',
          },
        ]}
        className="pb-0"
      />

      <VerifyPasswordChange/>
    </div>
  )
}
