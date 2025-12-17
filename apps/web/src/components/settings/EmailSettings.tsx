import {useState} from 'react';
import {Button} from '@web/components/ui/button';
import {
  useEmailSettings,
  useUpdateEmailSettings,
  useDisconnectEmail,
  emailApi,
} from '@web/services/email';

export function EmailSettings() {
  const {data: settings, isLoading, error} = useEmailSettings();
  const updateSettings = useUpdateEmailSettings();
  const disconnectEmail = useDisconnectEmail();
  const [emailFilter, setEmailFilter] = useState('');
  const [isFilterDirty, setIsFilterDirty] = useState(false);

  const handleConnect = async () => {
    const response = await emailApi.getOAuthUrl();
    window.location.href = response.authUrl;
  };

  const handleDisconnect = () => {
    disconnectEmail.mutate();
  };

  const handleFilterChange = (value: string) => {
    setEmailFilter(value);
    setIsFilterDirty(value !== (settings?.emailFilter || ''));
  };

  const handleSaveFilter = () => {
    updateSettings.mutate(
      {emailFilter},
      {
        onSuccess: () => {
          setIsFilterDirty(false);
        },
      },
    );
  };

  if (isLoading) {
    return null;
  }

  if (error || !settings?.emailIntegrationEnabled) {
    return null;
  }

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-6'>
      <h2 className='text-lg font-semibold text-teal-800 mb-4'>Email Integration</h2>

      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-sm font-medium text-gray-900'>Gmail Connection</h3>
            <p className='text-sm text-gray-500'>
              {settings.isConnected
                ? 'Your Gmail account is connected'
                : 'Connect your Gmail account to import links from emails'}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {settings.isConnected && (
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 rounded-full bg-green-500'></div>
                <span className='text-sm text-green-600'>Connected</span>
              </div>
            )}
            {settings.isConnected ? (
              <Button
                variant='outline'
                onClick={handleDisconnect}
                disabled={disconnectEmail.isPending}
              >
                {disconnectEmail.isPending ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            ) : (
              <Button onClick={handleConnect}>Connect Gmail</Button>
            )}
          </div>
        </div>

        {settings.isConnected && (
          <div className='border-t border-gray-200 pt-4'>
            <h3 className='text-sm font-medium text-gray-900 mb-2'>Email Filter</h3>
            <p className='text-sm text-gray-500 mb-3'>
              Specify a Gmail search filter to match emails for link extraction. The system will
              automatically append "is:unread" to only process new emails.
            </p>
            <div className='flex gap-3'>
              <input
                type='text'
                value={isFilterDirty ? emailFilter : settings.emailFilter || ''}
                onChange={(e) => handleFilterChange(e.target.value)}
                placeholder='e.g., label:stash or from:newsletter@example.com'
                className='flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'
              />
              <Button
                onClick={handleSaveFilter}
                disabled={!isFilterDirty || updateSettings.isPending}
                variant={isFilterDirty ? 'default' : 'outline'}
              >
                {updateSettings.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className='text-xs text-gray-400 mt-2'>
              Examples: "label:newsletters", "from:example.com", "subject:weekly digest"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
