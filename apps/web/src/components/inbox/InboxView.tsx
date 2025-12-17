import {useEffect, useRef, useCallback} from 'react';
import {match} from 'ts-pattern';
import {
  useUnreadEmailItems,
  useMarkAllEmailItemsRead,
  type EmailItem,
} from '@web/services/email';
import {InboxItem} from './InboxItem';
import {Button} from '@web/components/ui/button';
import {CheckCheck, Loader2} from 'lucide-react';

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
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  items: EmailItem[];
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore();
      }
    },
    [hasNextPage, isFetchingNextPage, onLoadMore],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <p className='text-sm text-amber-700'>
          {items.length} unread items{hasNextPage ? '+' : ''}
        </p>
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
          <InboxItem key={item.id} item={item} />
        ))}
      </div>

      <div ref={loadMoreRef} className='py-4 flex justify-center'>
        {isFetchingNextPage && (
          <div className='flex items-center gap-2 text-teal-600'>
            <Loader2 className='h-5 w-5 animate-spin' />
            <span className='text-sm'>Loading more...</span>
          </div>
        )}
      </div>
    </div>
  );
}

type InboxViewState =
  | {type: 'loading'}
  | {type: 'error'; error: string}
  | {type: 'empty'}
  | {type: 'success'; items: EmailItem[]};

export function InboxView() {
  const {data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage} =
    useUnreadEmailItems();
  const markAllReadMutation = useMarkAllEmailItemsRead();

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  const state: InboxViewState = match({isLoading, error, allItems})
    .with({isLoading: true}, () => ({type: 'loading'}) as const)
    .when(
      ({error}) => error !== null && error !== undefined,
      ({error}) => ({type: 'error', error: error?.message || 'Unknown error'}) as const,
    )
    .when(
      ({allItems}) => allItems.length === 0,
      () => ({type: 'empty'}) as const,
    )
    .otherwise(({allItems}) => ({type: 'success', items: allItems}) as const);

  return match(state)
    .with({type: 'loading'}, () => <LoadingState />)
    .with({type: 'error'}, ({error}) => <ErrorState error={error} />)
    .with({type: 'empty'}, () => <EmptyState />)
    .with({type: 'success'}, ({items}) => (
      <ItemsList
        items={items}
        onMarkAllRead={handleMarkAllRead}
        isMarkingAll={markAllReadMutation.isPending}
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleLoadMore}
      />
    ))
    .exhaustive();
}
