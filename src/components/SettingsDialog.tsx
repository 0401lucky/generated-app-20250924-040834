import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChatStore, ApiProvider } from '@/hooks/useChatStore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings } from 'lucide-react';
const settingsSchema = z.object({
  provider: z.enum(['cloudflare', 'openai', 'google', 'anthropic', 'custom']),
  apiKey: z.string().min(1, 'API Key is required.'),
  baseUrl: z.string().optional(),
});
type SettingsFormData = z.infer<typeof settingsSchema>;
export function SettingsDialog() {
  const settingsOpen = useChatStore((s) => s.settingsOpen);
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen);
  const currentSettings = useChatStore((s) => s.settings);
  const setSettings = useChatStore((s) => s.setSettings);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: currentSettings,
  });
  const onSubmit = (data: SettingsFormData) => {
    setSettings(data);
  };
  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Settings
            </DialogTitle>
            <DialogDescription>
              Configure your AI provider. Your key is sent directly to the backend and never stored in the browser.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <Controller
                name="provider"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloudflare">Cloudflare AI</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <div className="col-span-3 flex flex-col">
                <Input
                  id="apiKey"
                  type="password"
                  {...register('apiKey')}
                  className="w-full"
                />
                {errors.apiKey && (
                  <p className="text-red-500 text-xs mt-1">{errors.apiKey.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseUrl" className="text-right">
                Base URL
              </Label>
              <Input
                id="baseUrl"
                placeholder="Optional"
                {...register('baseUrl')}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}