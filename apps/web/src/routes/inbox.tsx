import {createFileRoute, useRouter} from '@tanstack/react-router';
import {useEffect} from 'react';
import {RefreshCw} from 'lucide-react';
import {InboxView} from '@web/components/inbox/InboxView';
import {Button} from '@web/components/ui/button';
import {requireAuth, isAuthenticated} from '@web/services';
import {useTriggerEmailRefresh} from '@web/services/email';
import {AuthenticatedLayout} from '@web/components/layout/AuthenticatedLayout';

export const Route = createFileRoute('/inbox')({
  beforeLoad: requireAuth,
  component: Inbox,
});

function Inbox() {
  const router = useRouter();
  const triggerRefreshMutation = useTriggerEmailRefresh();

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

  const handleRefresh = () => {
    triggerRefreshMutation.mutate();
  };

  return (
    <AuthenticatedLayout>
      <div className='h-full flex flex-col'>
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-semibold text-teal-800'>Inbox</h1>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={triggerRefreshMutation.isPending}
            className='flex items-center gap-2'
          >
            <RefreshCw className={`h-4 w-4 ${triggerRefreshMutation.isPending ? 'animate-spin' : ''}`} />
            {triggerRefreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className='flex-1 overflow-auto'>
          <InboxView />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
