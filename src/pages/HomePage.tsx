import { useEffect } from 'react';
import { SessionSidebar } from '@/components/SessionSidebar';
import { ChatView } from '@/components/ChatView';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useChatStore } from '@/hooks/useChatStore';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
export function HomePage() {
  const initialize = useChatStore((s) => s.initialize);
  const isSidebarOpen = useChatStore((s) => s.isSidebarOpen);
  const isMobile = useIsMobile();
  useEffect(() => {
    initialize();
  }, [initialize]);
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-900">
      <div className="absolute inset-0 -z-0 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-neutral-950">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 opacity-20 blur-[100px]"></div>
      </div>
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" />
      )}
      <div className="relative z-10 flex h-full w-full">
        <SessionSidebar />
        <main
          className={cn(
            'flex flex-1 flex-col transition-all duration-300 ease-in-out',
            isSidebarOpen && !isMobile ? 'md:ml-72' : 'md:ml-0'
          )}
        >
          <ChatView />
        </main>
      </div>
      <SettingsDialog />
      <Toaster richColors theme="system" />
    </div>
  );
}