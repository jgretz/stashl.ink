import {match} from 'ts-pattern';
import {useFeeds, useDeleteFeed, type RssFeed} from '@web/services/feeds';
import {FeedCard} from './FeedCard';

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
      <p className='text-red-600'>Failed to load feeds: {error}</p>
      <p className='text-gray-500 text-sm mt-2'>Please try again.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className='text-center py-12'>
      <p className='text-gray-500'>No RSS feeds yet. Add your first feed above!</p>
    </div>
  );
}

function FeedsList({feeds, onDelete}: {feeds: RssFeed[]; onDelete: (feedId: string) => void}) {
  return (
    <div className='space-y-4'>
      {feeds.map((feed) => (
        <FeedCard key={feed.id} feed={feed} onDelete={() => onDelete(feed.id)} />
      ))}
    </div>
  );
}

type FeedListState =
  | {type: 'loading'}
  | {type: 'error'; error: string}
  | {type: 'empty'}
  | {type: 'success'; feeds: RssFeed[]};

export function FeedList() {
  const {data, isLoading, error} = useFeeds();
  const deleteFeedMutation = useDeleteFeed();

  const handleDelete = (feedId: string) => {
    deleteFeedMutation.mutate(feedId);
  };

  const state: FeedListState = match({isLoading, error, data})
    .with({isLoading: true}, () => ({type: 'loading'}) as const)
    .when(
      ({error}) => error !== null && error !== undefined,
      ({error}) => ({type: 'error', error: error?.message || 'Unknown error'}) as const,
    )
    .when(
      ({data}) => !data?.feeds || data.feeds.length === 0,
      () => ({type: 'empty'}) as const,
    )
    .otherwise(({data}) => ({type: 'success', feeds: data!.feeds}) as const);

  return match(state)
    .with({type: 'loading'}, () => <LoadingState />)
    .with({type: 'error'}, ({error}) => <ErrorState error={error} />)
    .with({type: 'empty'}, () => <EmptyState />)
    .with({type: 'success'}, ({feeds}) => <FeedsList feeds={feeds} onDelete={handleDelete} />)
    .exhaustive();
}
