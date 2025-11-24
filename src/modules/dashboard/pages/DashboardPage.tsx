import AdminLayout from "@/layouts/AdminLayout";
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb'
import Dashboard from './../components/Dashboard';

export default function DashboardPage() {
  return (
    <AdminLayout>
    <div className='flex flex-col gap-4'>
      <Breadcrumb
          title="common.dashboard.title"
          defaultTitle="Dashboard"
          showTitle={true}
          items={[
          ]}
          className='pb-0'
        />
        <Dashboard />
      </div>
    </AdminLayout>
  );
}
