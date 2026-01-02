import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import UserLogs from './../components/UserLogs';

export default function UserLogsPage() {
  return (
      <div className='flex flex-col gap-4'>
      <Breadcrumb
          title="common.user_logs.title"
          defaultTitle="User Logs"
          showTitle={true}
          items={[
            {
              label: "common.settings.title",
              defaultLabel: "Settings",
              href: "/settings",
            },
            {
              label: "common.user_logs.title",
              defaultLabel: "User Logs",
              href: "/settings/user-logs",
            },
          ]}
          className='pb-0'
        />
        <UserLogs />
      </div>
  );
}
