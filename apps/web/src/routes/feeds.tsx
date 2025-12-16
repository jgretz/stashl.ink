import {createFileRoute, useRouter} from '@tanstack/react-router';
import {useEffect} from 'react';
import {FeedList} from '@web/components/feeds/FeedList';
import {AddFeedDialog} from '@web/components/feeds/AddFeedDialog';
import {requireAuth, isAuthenticated} from '@web/services';
import {AuthenticatedLayout} from '@web/components/layout/AuthenticatedLayout';

export const Route = createFileRoute('/feeds')({
  beforeLoad: requireAuth,
  component: Feeds,
});

function Feeds() {
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
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-semibold text-teal-800'>RSS Feeds</h1>
          <AddFeedDialog />
        </div>

        <div className='flex-1'>
          <FeedList />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
