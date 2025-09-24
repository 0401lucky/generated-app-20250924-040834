import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { chatService, Model } from '@/lib/chat';
import type { Message, SessionInfo } from '../../worker/types';
import { toast } from 'sonner';
export type ApiProvider = 'cloudflare' | 'openai' | 'google' | 'anthropic' | 'custom';
export interface ApiSettings {
  provider: ApiProvider;
  apiKey: string;
  baseUrl?: string;
}
interface ChatStore {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  messages: Message[];
  streamingMessage: string | null;
  isLoading: boolean;
  isProcessing: boolean;
  isSidebarOpen: boolean;
  settings: ApiSettings;
  settingsOpen: boolean;
  models: Model[];
  isFetchingModels: boolean;
  // Actions
  initialize: () => Promise<void>;
  loadSessions: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  newSession: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (message: string, model: string) => Promise<void>;
  setSettings: (settings: ApiSettings) => Promise<void>;
  fetchModels: () => Promise<void>;
  toggleSidebar: () => void;
  setSettingsOpen: (isOpen: boolean) => void;
}
export const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    sessions: [],
    currentSessionId: null,
    messages: [],
    streamingMessage: null,
    isLoading: true,
    isProcessing: false,
    isSidebarOpen: window.innerWidth > 768,
    settings: {
      provider: 'cloudflare',
      apiKey: '',
      baseUrl: '',
    },
    settingsOpen: false,
    models: [],
    isFetchingModels: false,
    initialize: async () => {
      set({ isLoading: true });
      try {
        const res = await chatService.listSessions();
        if (res.success && res.data && res.data.length > 0) {
          const sessions = res.data;
          set({ sessions });
          await get().switchSession(sessions[0].id);
        } else {
          await get().newSession();
        }
      } catch (error) {
        console.error('Initialization failed:', error);
        toast.error('Failed to initialize chat sessions.');
        await get().newSession();
      } finally {
        set({ isLoading: false });
      }
    },
    loadSessions: async () => {
      const res = await chatService.listSessions();
      if (res.success && res.data) {
        set({ sessions: res.data });
      }
    },
    switchSession: async (sessionId: string) => {
      if (get().currentSessionId === sessionId && !get().isLoading) return;
      set({ isLoading: true, messages: [], streamingMessage: null, currentSessionId: sessionId });
      chatService.switchSession(sessionId);
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        set({
          messages: res.data.messages,
          isProcessing: res.data.isProcessing,
        });
      }
      set({ isLoading: false });
    },
    newSession: async () => {
      set({ isLoading: true, messages: [], streamingMessage: null });
      chatService.newSession();
      const newSessionId = chatService.getSessionId();
      set({ currentSessionId: newSessionId, messages: [] });
      await get().loadSessions();
      set({ isLoading: false });
    },
    deleteSession: async (sessionId: string) => {
      const { sessions, currentSessionId } = get();
      const res = await chatService.deleteSession(sessionId);
      if (res.success) {
        toast.success('Session deleted.');
        const remainingSessions = sessions.filter((s) => s.id !== sessionId);
        set({ sessions: remainingSessions });
        if (currentSessionId === sessionId) {
          if (remainingSessions.length > 0) {
            await get().switchSession(remainingSessions[0].id);
          } else {
            await get().newSession();
          }
        }
      } else {
        toast.error('Failed to delete session.');
      }
    },
    sendMessage: async (message: string, model: string) => {
      if (!message.trim()) return;
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      set((state) => {
        state.messages.push(userMessage);
        state.isProcessing = true;
        state.streamingMessage = '';
      });
      const currentSession = get().sessions.find(s => s.id === get().currentSessionId);
      if (!currentSession) {
          await chatService.createSession(undefined, get().currentSessionId!, message);
          await get().loadSessions();
      }
      const response = await chatService.sendMessage(message, model, (chunk) => {
        set((state) => {
          if (state.streamingMessage !== null) {
            state.streamingMessage += chunk;
          }
        });
      });
      if (response.error) {
        toast.error(response.error);
      }
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        set({
          messages: res.data.messages,
          isProcessing: res.data.isProcessing,
        });
      }
      set({ streamingMessage: null, isProcessing: false });
    },
    setSettings: async (settings: ApiSettings) => {
      set({ settings });
      try {
        await chatService.configure(settings);
        toast.success('API settings saved successfully!');
        set({ settingsOpen: false });
        await get().fetchModels();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save API settings.';
        toast.error(errorMessage);
        console.error('Failed to configure API:', error);
      }
    },
    fetchModels: async () => {
      set({ isFetchingModels: true, models: [] });
      const res = await chatService.listModels();
      if (res.success && res.data) {
        set({ models: res.data });
        if (res.data.length === 0) {
          toast.info("No models found for this provider.");
        }
      } else {
        toast.error(res.error || "Failed to fetch models.");
      }
      set({ isFetchingModels: false });
    },
    toggleSidebar: () => {
      set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
    },
    setSettingsOpen: (isOpen: boolean) => {
      set({ settingsOpen: isOpen });
    },
  }))
);