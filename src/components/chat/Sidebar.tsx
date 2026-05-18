import { useMemo, useRef, useState } from "react";
import type { Chat } from "@/lib/chat/types";
import { Logo } from "./Logo";
import {
  Download,
  MessageSquarePlus,
  Pin,
  PinOff,
  Search,
  Settings as SettingsIcon,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  chats: Chat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: () => void;
  onExportAll: () => void;
  onImportAll: (file: File) => void;
}

function filterChats(chats: Chat[], q: string): Chat[] {
  if (!q.trim()) return chats;
  const needle = q.toLowerCase();
  return chats.filter((c) => {
    if (c.title.toLowerCase().includes(needle)) return true;
    return c.messages.some((m) => m.content.toLowerCase().includes(needle));
  });
}

function groupChats(chats: Chat[]) {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const today = startOfDay(now);
  const yesterday = today - 24 * 60 * 60 * 1000;
  const last7 = today - 7 * 24 * 60 * 60 * 1000;

  const pinned = chats.filter((c) => c.pinned);
  const rest = chats.filter((c) => !c.pinned);

  const groups: { label: string; items: Chat[] }[] = [];
  if (pinned.length) groups.push({ label: "Pinned", items: pinned });

  const buckets = [
    { label: "Today", items: [] as Chat[] },
    { label: "Yesterday", items: [] as Chat[] },
    { label: "Last 7 days", items: [] as Chat[] },
    { label: "Older", items: [] as Chat[] },
  ];
  const sorted = [...rest].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const c of sorted) {
    if (c.updatedAt >= today) buckets[0].items.push(c);
    else if (c.updatedAt >= yesterday) buckets[1].items.push(c);
    else if (c.updatedAt >= last7) buckets[2].items.push(c);
    else buckets[3].items.push(c);
  }
  for (const b of buckets) if (b.items.length) groups.push(b);
  return groups;
}

export function Sidebar({
  chats,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onTogglePin,
  onOpenSettings,
  onExportAll,
  onImportAll,
}: Props) {
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => filterChats(chats, q), [chats, q]);
  const groups = useMemo(() => groupChats(filtered), [filtered]);

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-[var(--sidebar-bg)]">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <Logo size={22} />
        <span className="text-[15px] font-semibold tracking-tight">NexusAI</span>
      </div>
      <div className="px-3 pb-2">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MessageSquarePlus size={15} />
          New chat
        </button>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-md border border-border bg-background/40 py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            {q ? "No matches." : "No conversations yet."}
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((c) => (
                  <HistoryItem
                    key={c.id}
                    chat={c}
                    active={c.id === activeId}
                    onSelect={() => onSelect(c.id)}
                    onDelete={() => onDelete(c.id)}
                    onTogglePin={() => onTogglePin(c.id)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <SettingsIcon size={15} />
          Settings
        </button>
        <div className="flex items-center gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportAll(f);
              e.target.value = "";
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Backup"
                aria-label="Backup"
              >
                <Download size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuItem onClick={onExportAll}>
                <Download size={13} className="mr-2" /> Export all chats (.json)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                <Upload size={13} className="mr-2" /> Import from file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-muted-foreground">
            <User size={14} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function HistoryItem({
  chat,
  active,
  onSelect,
  onDelete,
  onTogglePin,
}: {
  chat: Chat;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors ${
          active ? "bg-accent text-foreground" : "text-foreground/80 hover:bg-accent/60"
        }`}
      >
        <button
          onClick={onSelect}
          className="min-w-0 flex-1 truncate text-left"
          title={chat.title}
        >
          {chat.title}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-opacity hover:bg-background hover:text-foreground ${
            chat.pinned
              ? "text-primary opacity-100"
              : "text-muted-foreground opacity-0 group-hover:opacity-100"
          }`}
          aria-label={chat.pinned ? "Unpin chat" : "Pin chat"}
          title={chat.pinned ? "Unpin" : "Pin"}
        >
          {chat.pinned ? <PinOff size={13} /> : <Pin size={13} />}
        </button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-destructive group-hover:opacity-100"
              aria-label="Delete chat"
            >
              <Trash2 size={13} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-56 p-3">
            <p className="text-sm">Delete this conversation?</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="rounded-md bg-destructive px-2.5 py-1 text-xs text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </li>
  );
}
