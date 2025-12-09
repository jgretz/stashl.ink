import {useRouter} from '@tanstack/react-router';
import {Link} from 'lucide-react';
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
      <div className='flex min-h-screen w-full'>
        <Sidebar side='left' variant='sidebar' collapsible='none' className='border-r'>
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

        <main className='flex-1 bg-[oklch(0.98_0.025_82)] flex flex-col'>
          <div className='flex-1 p-4'>{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
