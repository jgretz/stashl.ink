import {createFileRoute, useRouter} from '@tanstack/react-router';
import {useEffect} from 'react';
import {LinkList} from '@web/components/links/LinkList';
import {AddLinkForm} from '@web/components/links/AddLinkForm';
import {requireAuth, isAuthenticated} from '@web/services';
import {AuthenticatedLayout} from '@web/components/layout/AuthenticatedLayout';

export const Route = createFileRoute('/list')({
  beforeLoad: requireAuth,
  component: List,
});

function List() {
  const router = useRouter();

  useEffect(() => {
    // Client-side auth check after component mounts
    if (!isAuthenticated()) {
      router.navigate({
        to: '/login',
        search: {
          redirect: window.location.href,
        },
      });
    }
  }, [router]);

  // Don't render content during SSR to avoid hydration mismatch
  if (typeof document === 'undefined') {
    return null;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className='h-full flex flex-col'>
        <div className='flex justify-end mb-4'>
          <AddLinkForm />
        </div>

        <div className='flex-1'>
          <LinkList />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
