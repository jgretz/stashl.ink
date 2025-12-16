import type {RssFeedItem} from '@web/services/feeds';
import {useMarkItemRead} from '@web/services/feeds';
import {useCreateLink} from '@web/services/links';
import {Check, ExternalLink, Bookmark} from 'lucide-react';

interface ReaderItemProps {
  item: RssFeedItem;
}

export function ReaderItem({item}: ReaderItemProps) {
  const markReadMutation = useMarkItemRead();
  const createLinkMutation = useCreateLink();

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markReadMutation.mutate(item.id);
  };

  const handleClick = () => {
    markReadMutation.mutate(item.id);
  };

  const handleSaveLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    createLinkMutation.mutate(
      {
        url: item.link,
        title: item.title,
        description: item.summary || undefined,
      },
      {
        onSuccess: () => {
          markReadMutation.mutate(item.id);
        },
      },
    );
  };

  return (
    <div className='border border-amber-200 rounded-lg bg-amber-50 shadow-sm hover:shadow-md transition-all hover:border-amber-300 hover:bg-amber-100 overflow-hidden'>
      <div className='flex'>
        {item.imageUrl && (
          <div
            className='w-32 h-32 flex-shrink-0 bg-cover bg-center'
            style={{backgroundImage: `url(${item.imageUrl})`}}
          />
        )}

        <div className='flex-1 p-4 flex items-start justify-between gap-4 min-w-0'>
          <div className='flex-1 min-w-0'>
            <p className='text-xs font-medium text-teal-600 mb-1'>{item.feedTitle}</p>
            <a
              href={item.link}
              target='_blank'
              rel='noopener noreferrer'
              onClick={handleClick}
              className='group flex items-center gap-2'
            >
              <h3 className='text-lg font-medium text-teal-700 group-hover:text-orange-600 transition-colors line-clamp-2'>
                {item.title}
              </h3>
              <ExternalLink className='h-4 w-4 flex-shrink-0 text-teal-600 group-hover:text-orange-600' />
            </a>

            {item.summary && <p className='text-amber-900 mt-2 line-clamp-3'>{item.summary}</p>}

            <p className='text-xs text-amber-700 mt-3'>{formatDate(item.pubDate)}</p>
          </div>

          <div className='flex items-center gap-1'>
            <button
              onClick={handleSaveLink}
              disabled={createLinkMutation.isPending}
              className='p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors disabled:opacity-50'
              title='Save to links'
            >
              <Bookmark className={`h-5 w-5 ${createLinkMutation.isPending ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={handleMarkRead}
              disabled={markReadMutation.isPending}
              className='p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-full transition-colors disabled:opacity-50'
              title='Mark as read'
            >
              <Check className={`h-5 w-5 ${markReadMutation.isPending ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
