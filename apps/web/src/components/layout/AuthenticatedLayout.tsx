import {useRouter} from '@tanstack/react-router';
import {Link, Rss, BookOpen} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@web/components/ui/sidebar';
import {Separator} from '@web/components/ui/separator';
import {clearAuthToken} from '@web/services';
import {Mascot} from '@web/components/Mascot';
import {Button} from '@web/components/ui/button';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({children}: AuthenticatedLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearAuthToken();
    router.navigate({
      to: '/login',
    });
  };

  return (
    <SidebarProvider className='min-h-screen'>
      <Sidebar side='left' variant='sidebar' collapsible='offcanvas' className='border-r'>
          <SidebarHeader className='border-b border-sidebar-border'>
            <div className='flex items-center gap-3 px-2 py-2'>
              <Mascot />
              <h1 className='text-lg font-bold text-sidebar-foreground'>Stashl.ink</h1>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='/list'>
                        <Link className='w-4 h-4' />
                        <span>Links</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='/reader'>
                        <BookOpen className='w-4 h-4' />
                        <span>Reader</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='/feeds'>
                        <Rss className='w-4 h-4' />
                        <span>Feeds</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className='border-t border-sidebar-border'>
            <Button
              variant='ghost'
              onClick={handleLogout}
              className='w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            >
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

      <SidebarInset className='bg-[oklch(0.98_0.025_82)] md:ml-64'>
        <header className='flex h-14 items-center gap-3 border-b px-4 md:hidden'>
          <SidebarTrigger />
          <Separator orientation='vertical' className='h-6' />
          <Mascot size='sm' />
          <span className='font-bold text-sidebar-foreground'>Stashl.ink</span>
        </header>
        <div className='flex-1 p-4'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
