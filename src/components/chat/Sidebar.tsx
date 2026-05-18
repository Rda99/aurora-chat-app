import { useMemo, useState } from "react";
import type { Chat } from "@/lib/chat/types";
import { Logo } from "./Logo";
import { MessageSquarePlus, Settings as SettingsIcon, Trash2, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  chats: Chat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
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

  const groups: { label: string; items: Chat[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Last 7 days", items: [] },
    { label: "Older", items: [] },
  ];
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const c of sorted) {
    if (c.updatedAt >= today) groups[0].items.push(c);
    else if (c.updatedAt >= yesterday) groups[1].items.push(c);
    else if (c.updatedAt >= last7) groups[2].items.push(c);
    else groups[3].items.push(c);
  }
  return groups.filter((g) => g.items.length > 0);
}

export function Sidebar({
  chats,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onOpenSettings,
}: Props) {
  const groups = useMemo(() => groupChats(chats), [chats]);

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-[var(--sidebar-bg)]">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <Logo size={22} />
        <span className="text-[15px] font-semibold tracking-tight">NexusAI</span>
      </div>
      <div className="px-3 pb-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MessageSquarePlus size={15} />
          New chat
        </button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            No conversations yet.
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
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-muted-foreground">
          <User size={14} />
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
}: {
  chat: Chat;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
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
