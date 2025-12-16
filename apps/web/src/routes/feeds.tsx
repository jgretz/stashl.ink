import {createFileRoute, useRouter} from '@tanstack/react-router';
import {useEffect} from 'react';
import {RefreshCw} from 'lucide-react';
import {FeedList} from '@web/components/feeds/FeedList';
import {AddFeedDialog} from '@web/components/feeds/AddFeedDialog';
import {Button} from '@web/components/ui/button';
import {requireAuth, isAuthenticated} from '@web/services';
import {useTriggerImportAll} from '@web/services/feeds';
import {AuthenticatedLayout} from '@web/components/layout/AuthenticatedLayout';

export const Route = createFileRoute('/feeds')({
  beforeLoad: requireAuth,
  component: Feeds,
});

function Feeds() {
  const router = useRouter();
  const triggerImportAllMutation = useTriggerImportAll();

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

  const handleRefreshAll = () => {
    triggerImportAllMutation.mutate();
  };

  return (
    <AuthenticatedLayout>
      <div className='h-full flex flex-col'>
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-semibold text-teal-800'>RSS Feeds</h1>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefreshAll}
              disabled={triggerImportAllMutation.isPending}
              className='flex items-center gap-2'
            >
              <RefreshCw className={`h-4 w-4 ${triggerImportAllMutation.isPending ? 'animate-spin' : ''}`} />
              {triggerImportAllMutation.isPending ? 'Refreshing...' : 'Refresh All'}
            </Button>
            <AddFeedDialog />
          </div>
        </div>

        <div className='flex-1'>
          <FeedList />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
