import { useEffect, useState } from "react";
import type { ProviderId, Settings } from "@/lib/chat/types";
import { PROVIDERS, getProvider } from "@/lib/chat/providers";
import { ApiError, testConnection } from "@/lib/chat/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: Settings;
  onSave: (s: Settings) => void;
}

export function SettingsModal({ open, onOpenChange, settings, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setShowKey(false);
    }
  }, [open, settings]);

  const setProvider = (id: ProviderId) => {
    const p = getProvider(id);
    setDraft((d) => ({
      ...d,
      providerId: id,
      endpoint: p.endpoint || d.endpoint,
      model: p.defaultModel || d.model,
    }));
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await testConnection(draft);
      toast.success("Connected successfully");
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) toast.error("Invalid API key");
      else if (err.status === 429) toast.error("Rate limit hit");
      else toast.error("Connection failed — check endpoint and key");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
    toast.success("Settings saved");
  };

  const currentProvider = getProvider(draft.providerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider and chat behavior. Settings persist in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <section>
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
              Provider
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROVIDERS.map((p) => {
                const active = p.id === draft.providerId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                      active ? "border-primary/60 bg-primary/5" : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.dot }} />
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                Endpoint
              </Label>
              <Input
                value={draft.endpoint}
                onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                Model
              </Label>
              <Input
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder={currentProvider.modelPlaceholder}
              />
            </div>
          </section>

          <section>
            <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
              API Key
            </Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder={
                  currentProvider.requiresKey
                    ? "Paste your API key"
                    : "Not required for this provider"
                }
                className="pr-16"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {draft.apiKey.trim() && <Check size={14} className="text-primary" />}
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Key stored locally in your browser only. Never sent to Lovable servers.
            </p>
          </section>

          <section>
            <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
              System prompt
            </Label>
            <Textarea
              rows={4}
              value={draft.systemPrompt}
              onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
              placeholder="Optional. Set the assistant's persona or instructions."
              className="resize-none"
            />
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Temperature
                </Label>
                <span className="text-xs tabular-nums text-foreground/80">
                  {draft.temperature.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={2}
                step={0.05}
                value={[draft.temperature]}
                onValueChange={([v]) => setDraft({ ...draft, temperature: v })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                Max tokens
              </Label>
              <Input
                type="number"
                min={1}
                value={draft.maxTokens}
                onChange={(e) => setDraft({ ...draft, maxTokens: Number(e.target.value) || 0 })}
              />
            </div>
          </section>

          <section className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Stream responses</p>
              <p className="text-[11px] text-muted-foreground">Show tokens as they arrive.</p>
            </div>
            <Switch
              checked={draft.stream}
              onCheckedChange={(v) => setDraft({ ...draft, stream: v })}
            />
          </section>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground/90 hover:bg-accent disabled:opacity-50"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : null}
            Test connection
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
