import type {RssFeed} from '@web/services/feeds';
import {useTriggerImport} from '@web/services/feeds';
import {RefreshCw, Trash2, ExternalLink} from 'lucide-react';

interface FeedCardProps {
  feed: RssFeed;
  onDelete: () => void;
}

export function FeedCard({feed, onDelete}: FeedCardProps) {
  const triggerImportMutation = useTriggerImport();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${feed.title}"?`)) {
      onDelete();
    }
  };

  const handleImport = () => {
    triggerImportMutation.mutate(feed.id);
  };

  return (
    <div className='border border-amber-200 rounded-lg p-4 bg-amber-50 shadow-sm hover:shadow-md transition-all hover:border-amber-300 hover:bg-amber-100'>
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h3 className='text-lg font-medium text-teal-700 truncate'>{feed.title}</h3>
            {feed.siteUrl && (
              <a
                href={feed.siteUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-teal-600 hover:text-orange-600 transition-colors'
                title='Visit site'
              >
                <ExternalLink className='h-4 w-4' />
              </a>
            )}
          </div>

          <p className='text-sm text-teal-600 truncate mt-1'>{feed.feedUrl}</p>
          <div className='flex gap-4 mt-3'>
            <p className='text-xs text-amber-700'>Added {formatDate(feed.createdAt)}</p>
            {feed.lastSuccessfulImport && (
              <p className='text-xs text-teal-600'>Last import {formatDateTime(feed.lastSuccessfulImport)}</p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2 ml-4'>
          <button
            onClick={handleImport}
            disabled={triggerImportMutation.isPending}
            className='p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-full transition-colors disabled:opacity-50'
            title='Refresh feed'
          >
            <RefreshCw className={`h-4 w-4 ${triggerImportMutation.isPending ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDelete}
            className='p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors'
            title='Delete feed'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
