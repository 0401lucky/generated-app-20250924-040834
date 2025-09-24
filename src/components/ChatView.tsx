import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react';
import { useChatStore } from '@/hooks/useChatStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
export function ChatView() {
  const { messages, streamingMessage, isProcessing, sendMessage, isLoading } = useChatStore();
  const models = useChatStore((s) => s.models);
  const isFetchingModels = useChatStore((s) => s.isFetchingModels);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !selectedModel) return;
    sendMessage(input, selectedModel);
    setInput('');
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 p-4">
        <h2 className="text-lg font-semibold">Chat</h2>
        <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isFetchingModels || models.length === 0}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={isFetchingModels ? "Loading models..." : "Select a model"} />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full pt-16">
              <Loader className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            <div className="text-center text-neutral-500 dark:text-neutral-400 py-16 animate-fade-in">
              <Sparkles className="mx-auto h-12 w-12 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                Welcome to NexusChat
              </h3>
              <p className="mt-2">Start a conversation by typing a message below.</p>
              <p className="text-sm mt-4">
                Don't forget to set your API key in the <span className="font-semibold">Settings</span>.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn('flex items-start gap-4', msg.role === 'user' && 'justify-end')}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl p-4',
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            ))
          )}
          {streamingMessage !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="max-w-[80%] rounded-2xl p-4 bg-neutral-100 dark:bg-neutral-800">
                <p className="whitespace-pre-wrap">{streamingMessage}<span className="animate-pulse">█</span></p>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="w-full resize-none rounded-xl border-2 border-neutral-300 bg-transparent p-4 pr-16 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-neutral-700 dark:focus:ring-offset-neutral-950"
              rows={1}
              disabled={isProcessing}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-600 text-white transition-transform hover:scale-105 active:scale-95 disabled:bg-neutral-400"
              disabled={!input.trim() || isProcessing || !selectedModel}
            >
              {isProcessing ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}