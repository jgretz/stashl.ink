import {useEmailProcessorStats} from '@web/services/email';

type StatusLevel = 'green' | 'yellow' | 'red';

function getStatusLevel(statTime: string | undefined): StatusLevel {
  if (!statTime) return 'red';

  const lastRun = new Date(statTime);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);

  if (diffMinutes <= 60) return 'green';
  if (diffMinutes <= 120) return 'yellow';
  return 'red';
}

function getStatusColor(status: StatusLevel): string {
  switch (status) {
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
  }
}

function getStatusText(status: StatusLevel): string {
  switch (status) {
    case 'green':
      return 'Healthy';
    case 'yellow':
      return 'Warning';
    case 'red':
      return 'Critical';
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EmailStatusWidget() {
  const {data, isLoading, error} = useEmailProcessorStats();

  const stat = data?.stat;
  const statusLevel = getStatusLevel(stat?.statTime);
  const statusColor = getStatusColor(statusLevel);
  const statusText = getStatusText(statusLevel);

  if (isLoading) {
    return (
      <div className='rounded-lg border border-amber-200 bg-amber-50 p-6'>
        <h3 className='text-lg font-semibold text-teal-800 mb-4'>Email Processor Status</h3>
        <div className='animate-pulse'>
          <div className='h-4 bg-amber-200 rounded w-3/4 mb-2'></div>
          <div className='h-4 bg-amber-200 rounded w-1/2'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
        <h3 className='text-lg font-semibold text-red-800 mb-4'>Email Processor Status</h3>
        <p className='text-red-600'>Failed to load status</p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border border-amber-200 bg-amber-50 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-teal-800'>Email Processor Status</h3>
        <div className='flex items-center gap-2'>
          <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
          <span className='text-sm font-medium text-amber-900'>{statusText}</span>
        </div>
      </div>

      {stat ? (
        <div className='space-y-3'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-amber-700'>Last Run</span>
            <span className='text-sm font-medium text-amber-900'>{formatDate(stat.statTime)}</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-amber-700'>Users Processed</span>
            <span className='text-sm font-medium text-amber-900'>{stat.data.usersProcessed}</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-amber-700'>Emails Parsed</span>
            <span className='text-sm font-medium text-amber-900'>{stat.data.emailsParsed}</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-amber-700'>Links Found</span>
            <span className='text-sm font-medium text-green-600'>{stat.data.linksFound}</span>
          </div>
        </div>
      ) : (
        <p className='text-sm text-amber-700'>No email processor runs recorded yet</p>
      )}
    </div>
  );
}
