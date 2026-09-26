// D:\shop\shop_admin_front\src\modules\settings\app-settings\pages\AppSettingsPage.tsx
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import { SettingsPage } from '../components/SettingsPage';

export default function AppSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.app_settings.title"
        defaultTitle="App Settings"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.app_settings.title',
            defaultLabel: 'App Settings',
            href: '/settings/app-settings',
          },
        ]}
        className="pb-0"
      />

      <SettingsPage />
    </div>
  );
}