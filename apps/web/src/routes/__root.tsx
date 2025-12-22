import {createRootRoute, Outlet, HeadContent, Scripts} from '@tanstack/react-router';
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {Toaster} from 'sonner';
import {RootErrorComponent} from '../components/RootErrorComponent';

import '../globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function NotFound() {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-gray-800 mb-4'>404</h1>
        <p className='text-gray-600'>Page not found</p>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Stashl.ink',
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: 'favicon.svg',
      },
    ],
  }),
  component: Root,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFound,
});

export default function Root() {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className='min-h-screen'>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster position='bottom-right' richColors closeButton />
          <ReactQueryDevtools />
          <TanStackRouterDevtools />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
