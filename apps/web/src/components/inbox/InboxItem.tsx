import type {EmailItem} from '@web/services/email';
import {useMarkEmailItemRead} from '@web/services/email';
import {useCreateLink} from '@web/services/links';
import {Check, ExternalLink, Bookmark} from 'lucide-react';
import {toast} from 'sonner';

interface InboxItemProps {
  item: EmailItem;
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function extractSenderName(emailFrom: string): string {
  const match = emailFrom.match(/^([^<]+)</);
  if (match) return match[1].trim();
  return emailFrom.split('@')[0];
}

export function InboxItem({item}: InboxItemProps) {
  const markReadMutation = useMarkEmailItemRead();
  const createLinkMutation = useCreateLink();

  const formatDate = (date: string) => {
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
    markReadMutation.mutate(item.id, {
      onSuccess: () => toast.success('Marked as read'),
      onError: () => toast.error('Failed to mark as read'),
    });
  };

  const handleClick = () => {
    markReadMutation.mutate(item.id);
  };

  const domain = extractDomain(item.link);

  const handleSaveLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    createLinkMutation.mutate(
      {url: item.link},
      {
        onSuccess: () => {
          toast.success('Saved to links');
          markReadMutation.mutate(item.id);
        },
        onError: () => toast.error('Failed to save link'),
      },
    );
  };
  const senderName = extractSenderName(item.emailFrom);
  const displayTitle = item.title || domain;

  const ActionButtons = () => (
    <div className='flex items-center gap-3 md:gap-1'>
      <button
        onClick={handleSaveLink}
        disabled={createLinkMutation.isPending}
        className='p-3 md:p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors disabled:opacity-50'
        title='Save to links'
      >
        <Bookmark
          className={`h-8 w-8 md:h-5 md:w-5 ${createLinkMutation.isPending ? 'animate-pulse' : ''}`}
        />
      </button>
      <button
        onClick={handleMarkRead}
        disabled={markReadMutation.isPending}
        className='p-3 md:p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-full transition-colors disabled:opacity-50'
        title='Mark as read'
      >
        <Check
          className={`h-8 w-8 md:h-5 md:w-5 ${markReadMutation.isPending ? 'animate-pulse' : ''}`}
        />
      </button>
    </div>
  );

  const TextContent = () => (
    <div className='flex-1 min-w-0'>
      <p className='text-xs font-medium text-teal-600 mb-1'>From: {senderName}</p>
      <a
        href={item.link}
        target='_blank'
        rel='noopener noreferrer'
        onClick={handleClick}
        className='group flex items-center gap-2'
      >
        <h3 className='text-lg font-medium text-teal-700 group-hover:text-orange-600 transition-colors line-clamp-2'>
          {displayTitle}
        </h3>
        <ExternalLink className='h-4 w-4 shrink-0 text-teal-600 group-hover:text-orange-600' />
      </a>

      {item.description && (
        <p className='text-amber-900 mt-2 text-sm line-clamp-3'>{item.description}</p>
      )}

      <p className='text-xs text-amber-700 mt-2 truncate'>{domain}</p>
      <p className='text-xs text-amber-600 mt-1'>{formatDate(item.createdAt)}</p>
    </div>
  );

  return (
    <div className='border border-amber-200 rounded-lg bg-amber-50 shadow-sm hover:shadow-md transition-all hover:border-amber-300 hover:bg-amber-100 overflow-hidden'>
      {/* Mobile layout */}
      <div className='md:hidden'>
        <div className='flex items-center justify-end p-2'>
          <ActionButtons />
        </div>
        <div className='px-4 pb-4'>
          <TextContent />
        </div>
      </div>

      {/* Desktop layout */}
      <div className='hidden md:flex'>
        <div className='flex-1 p-4 flex items-start justify-between gap-4 min-w-0'>
          <TextContent />
          <ActionButtons />
        </div>
      </div>
    </div>
  );
}
