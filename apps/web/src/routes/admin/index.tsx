import {createFileRoute, useRouter} from '@tanstack/react-router';
import {useEffect} from 'react';
import {requireAuth, isAuthenticated} from '@web/services';
import {AdminLayout} from '@web/components/layout/AdminLayout';
import {TaskStatusWidget} from '@web/components/admin/TaskStatusWidget';

export const Route = createFileRoute('/admin/')({
  beforeLoad: requireAuth,
  component: AdminDashboard,
});

function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.navigate({
        to: '/login',
        search: {
          redirect: window.location.href,
        },
      });
    }
  }, [router]);

  if (typeof document === 'undefined') {
    return null;
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <AdminLayout>
      <div className='h-full flex flex-col'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-semibold text-teal-800'>Admin Dashboard</h1>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <TaskStatusWidget />
        </div>
      </div>
    </AdminLayout>
  );
}
