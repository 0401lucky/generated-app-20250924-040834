import { Plus, MessageSquare, Trash2, Settings, Menu, X } from 'lucide-react';
import { useChatStore } from '@/hooks/useChatStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
export function SessionSidebar() {
  const {
    sessions,
    currentSessionId,
    newSession,
    switchSession,
    deleteSession,
    isSidebarOpen,
    toggleSidebar,
    setSettingsOpen,
  } = useChatStore();
  const isMobile = useIsMobile();
  const handleSwitchSession = (sessionId: string) => {
    switchSession(sessionId);
    if (isMobile) {
      toggleSidebar();
    }
  };
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'fixed inset-y-0 left-0 z-40 md:static md:translate-x-0',
              'flex h-full w-72 flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 border-r border-neutral-200 dark:border-neutral-800'
            )}
          >
            <div className="flex h-full flex-col p-3">
              <div className="flex items-center justify-between p-2 mb-2">
                <h1 className="font-display text-2xl font-bold">NexusChat</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={newSession}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'group flex items-center justify-between rounded-lg p-2.5 text-sm font-medium cursor-pointer transition-colors',
                      currentSessionId === session.id
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                    )}
                    onClick={() => handleSwitchSession(session.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{session.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                        currentSessionId === session.id
                          ? 'text-white hover:bg-indigo-500'
                          : 'text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-auto border-t border-neutral-200 dark:border-neutral-800 pt-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 p-2.5 text-sm font-medium"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  <span>API Settings</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}