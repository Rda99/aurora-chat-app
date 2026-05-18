import { useState } from "react";
import type { Chat, Settings } from "@/lib/chat/types";
import { getProvider } from "@/lib/chat/providers";
import { Download, Menu, PanelLeftClose } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  chat: Chat | null;
  settings: Settings;
  onRename: (title: string) => void;
  onToggleSidebar: () => void;
  sidebarHidden: boolean;
  onOpenMobileSidebar: () => void;
}

export function ChatHeader({
  chat,
  settings,
  onRename,
  onToggleSidebar,
  sidebarHidden,
  onOpenMobileSidebar,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const provider = getProvider(settings.providerId);

  const startEdit = () => {
    if (!chat) return;
    setDraft(chat.title);
    setEditing(true);
  };
  const commit = () => {
    const t = draft.trim();
    if (chat && t) onRename(t);
    setEditing(false);
  };

  const exportChat = (fmt: "txt" | "md") => {
    if (!chat) return;
    const content = chat.messages
      .map((m) => {
        const role = m.role === "user" ? "You" : "Assistant";
        return fmt === "md" ? `**${role}:**\n\n${m.content}\n` : `${role}:\n${m.content}\n`;
      })
      .join("\n---\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chat.title.replace(/[^\w\-]+/g, "_") || "chat"}.${fmt}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-[var(--chat-bg)] px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onOpenMobileSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:flex"
          aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          title={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
        >
          <PanelLeftClose
            size={16}
            className={sidebarHidden ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </button>
        {editing && chat ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="min-w-0 rounded border border-border bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <button
            onClick={startEdit}
            className="min-w-0 truncate rounded px-1.5 py-0.5 text-sm font-medium hover:bg-accent"
            title={chat ? "Click to rename" : ""}
          >
            {chat?.title ?? "New chat"}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: provider.dot }}
          />
          <span className="font-medium text-foreground/80">{provider.name}</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="max-w-[160px] truncate">{settings.model || "no model"}</span>
        </div>
        {chat && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Export chat"
                title="Export chat"
              >
                <Download size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportChat("md")}>
                Export as Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportChat("txt")}>
                Export as Text (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
