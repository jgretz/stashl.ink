import {match} from 'ts-pattern';
import {useUnreadItems, useMarkAllRead, type RssFeedItem} from '@web/services/feeds';
import {ReaderItem} from './ReaderItem';
import {Button} from '@web/components/ui/button';
import {CheckCheck} from 'lucide-react';

function LoadingState() {
  return (
    <div className='flex justify-center py-12'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600'></div>
    </div>
  );
}

function ErrorState({error}: {error: string}) {
  return (
    <div className='text-center py-12'>
      <p className='text-red-600'>Failed to load items: {error}</p>
      <p className='text-gray-500 text-sm mt-2'>Please try again.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className='text-center py-12'>
      <p className='text-gray-500'>No unread items. You're all caught up!</p>
    </div>
  );
}

function ItemsList({
  items,
  onMarkAllRead,
  isMarkingAll,
}: {
  items: RssFeedItem[];
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
}) {
  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <p className='text-sm text-amber-700'>{items.length} unread items</p>
        <Button
          variant='outline'
          size='sm'
          onClick={onMarkAllRead}
          disabled={isMarkingAll}
          className='flex items-center gap-2'
        >
          <CheckCheck className='h-4 w-4' />
          {isMarkingAll ? 'Marking...' : 'Mark all as read'}
        </Button>
      </div>

      <div className='space-y-4'>
        {items.map((item) => (
          <ReaderItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

type ReaderViewState =
  | {type: 'loading'}
  | {type: 'error'; error: string}
  | {type: 'empty'}
  | {type: 'success'; items: RssFeedItem[]};

export function ReaderView() {
  const {data, isLoading, error} = useUnreadItems();
  const markAllReadMutation = useMarkAllRead();

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const state: ReaderViewState = match({isLoading, error, data})
    .with({isLoading: true}, () => ({type: 'loading'}) as const)
    .when(
      ({error}) => error !== null && error !== undefined,
      ({error}) => ({type: 'error', error: error?.message || 'Unknown error'}) as const,
    )
    .when(
      ({data}) => !data?.items || data.items.length === 0,
      () => ({type: 'empty'}) as const,
    )
    .otherwise(({data}) => ({type: 'success', items: data!.items}) as const);

  return match(state)
    .with({type: 'loading'}, () => <LoadingState />)
    .with({type: 'error'}, ({error}) => <ErrorState error={error} />)
    .with({type: 'empty'}, () => <EmptyState />)
    .with({type: 'success'}, ({items}) => (
      <ItemsList items={items} onMarkAllRead={handleMarkAllRead} isMarkingAll={markAllReadMutation.isPending} />
    ))
    .exhaustive();
}
