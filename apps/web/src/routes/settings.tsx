import {createFileRoute, useRouter} from '@tanstack/react-router';
import {useEffect} from 'react';
import {requireAuth, isAuthenticated} from '@web/services';
import {AuthenticatedLayout} from '@web/components/layout/AuthenticatedLayout';
import {EmailSettings} from '@web/components/settings/EmailSettings';

export const Route = createFileRoute('/settings')({
  beforeLoad: requireAuth,
  component: Settings,
});

function Settings() {
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
    <AuthenticatedLayout>
      <div className='h-full flex flex-col'>
        <div className='mb-6'>
          <h1 className='text-2xl font-semibold text-teal-800'>Settings</h1>
        </div>

        <div className='space-y-6'>
          <EmailSettings />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
