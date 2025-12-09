import {createFileRoute, useRouter} from '@tanstack/react-router';
import {useEffect} from 'react';
import {LinkList} from '@web/components/links/LinkList';
import {AddLinkForm} from '@web/components/links/AddLinkForm';
import {requireAuth, isAuthenticated, clearAuthToken} from '@web/services';
import {Mascot} from '@web/components/Mascot';

export const Route = createFileRoute('/list')({
  beforeLoad: requireAuth,
  component: List,
});

function List() {
  const router = useRouter();

  useEffect(() => {
    // Client-side auth check after component mounts
    if (!isAuthenticated()) {
      router.navigate({
        to: '/login',
        search: {
          redirect: window.location.href,
        },
      });
    }
  }, [router]);

  const handleLogout = () => {
    clearAuthToken();
    router.navigate({
      to: '/login',
    });
  };

  // Don't render content during SSR to avoid hydration mismatch
  if (typeof document === 'undefined') {
    return null;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className='max-w-[800px] mx-auto'>
      <div className='flex flex-row items-center justify-between py-5'>
        <div className='flex items-center gap-3'>
          <Mascot />
          <h1 className='text-3xl font-bold'>Stashl.ink</h1>
        </div>
        <button 
          onClick={handleLogout}
          className='px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors'
        >
          Logout
        </button>
      </div>

      <div className='flex justify-end mb-4'>
        <AddLinkForm />
      </div>

      <div className='space-y-8'>
        <LinkList />
      </div>
    </div>
  );
}
