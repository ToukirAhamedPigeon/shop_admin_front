import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import Options from '../components/Options';

export default function OptionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        title="common.options.title"
        defaultTitle="Options"
        showTitle
        items={[
          {
            label: 'common.settings.title',
            defaultLabel: 'Settings',
            href: '/settings',
          },
          {
            label: 'common.options.title',
            defaultLabel: 'Options',
            href: '/settings/options',
          },
        ]}
        className="pb-0"
      />

      <Options />
    </div>
  );
}