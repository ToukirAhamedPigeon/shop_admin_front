import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import ProfileEdit from './../components/ProfileEdit'

export default function ProfileEditPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.profile.title"
        defaultTitle="Edit Profile"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.profile.title',
            defaultLabel: 'Profile',
            href: '/settings/profile',
          },
        ]}
        className="pb-0"
      />

      <ProfileEdit/>
    </div>
  )
}
