import type {Link} from '@stashl/domain-types';

interface LinkCardProps {
  link: Link;
  onDelete: () => void;
}

function truncateUrl(url: string, maxLength = 75): string {
  return url.length > maxLength ? url.slice(0, maxLength) + '...' : url;
}

export function LinkCard({link, onDelete}: LinkCardProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${link.title}"?`)) {
      onDelete();
    }
  };

  return (
    <div className='border border-amber-200 rounded-lg p-4 bg-amber-50 shadow-sm hover:shadow-md transition-all hover:border-amber-300 hover:bg-amber-100 overflow-hidden'>
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center space-x-2'>
            <a
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              className='text-lg font-medium text-teal-700 hover:text-orange-600 truncate transition-colors'
            >
              {link.title}
            </a>
          </div>

          <p className='text-sm text-teal-600 truncate mt-1'>{truncateUrl(link.url)}</p>
          <p className='text-amber-900 mt-2 line-clamp-2'>{link.description}</p>
          <p className='text-xs text-amber-700 mt-3'>Added {formatDate(link.dateAdded)}</p>
        </div>

        <div className='flex items-center ml-4'>
          <button
            onClick={handleDelete}
            className='p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors'
            title='Delete link'
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
