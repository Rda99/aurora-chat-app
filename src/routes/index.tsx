import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { InputBar, type InputBarHandle } from "@/components/chat/InputBar";
import { SettingsModal } from "@/components/chat/SettingsModal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useChats } from "@/lib/chat/useChats";
import { useSettings } from "@/lib/chat/useSettings";
import { ApiError, streamChat } from "@/lib/chat/api";
import type { Chat, Message } from "@/lib/chat/types";

export const Route = createFileRoute("/")({
  component: ChatApp,
});

function ChatApp() {
  const chatsApi = useChats();
  const { settings, update: updateSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);
  const [sessionTokens, setSessionTokens] = useState(0);
  const inputRef = useRef<InputBarHandle>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (e instanceof ApiError) {
      if (e.status === 401) toast.error("Invalid API key. Check Settings.");
      else if (e.status === 429) toast.error("Rate limit hit. Wait a moment.");
      else if (e.status === 0)
        toast.error("Cannot reach API. Check endpoint URL or CORS.");
      else toast.error(`Request failed (${e.status})`);
    } else {
      toast.error("Something went wrong.");
    }
  }, []);

  const runCompletion = useCallback(
    async (chatId: string, history: Message[]) => {
      if (!settings.model || !settings.endpoint) {
        toast.error("Set an endpoint and model in Settings first.");
        return;
      }
      const assistantId = chatsApi.uid();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };
      chatsApi.appendMessage(chatId, assistantMsg);
      setAwaitingFirstToken(true);
      setStreamingId(assistantId);

      const controller = new AbortController();
      abortRef.current = controller;
      let acc = "";
      try {
        await streamChat({
          settings,
          messages: history,
          signal: controller.signal,
          onDelta: (delta) => {
            if (acc.length === 0) setAwaitingFirstToken(false);
            acc += delta;
            chatsApi.updateMessage(chatId, assistantId, acc);
          },
          onUsage: (usage) => {
            chatsApi.setMessageUsage(chatId, assistantId, usage);
            setSessionTokens((s) => s + usage.total);
          },
        });
      } catch (e) {
        handleError(e);
        if (acc.length === 0) {
          chatsApi.updateMessage(
            chatId,
            assistantId,
            "_The model did not respond. Try again or check Settings._",
          );
        }
      } finally {
        setStreamingId(null);
        setAwaitingFirstToken(false);
        abortRef.current = null;
      }
    },
    [chatsApi, handleError, settings],
  );

  const sendMessage = useCallback(
    async (text: string, images?: string[]) => {
      let chatId = chatsApi.activeId;
      let baseMessages: Message[] = chatsApi.activeChat?.messages ?? [];
      if (!chatId) {
        chatId = chatsApi.ensureChat(text || "Image conversation");
        baseMessages = [];
      }
      const userMsg: Message = {
        id: chatsApi.uid(),
        role: "user",
        content: text,
        images,
        createdAt: Date.now(),
      };
      chatsApi.appendMessage(chatId, userMsg);
      const history = [...baseMessages, userMsg];
      await runCompletion(chatId, history);
    },
    [chatsApi, runCompletion],
  );

  const handleEditUser = useCallback(
    async (messageId: string, newContent: string) => {
      const chat = chatsApi.activeChat;
      if (!chat || streamingId) return;
      const original = chat.messages.find((m) => m.id === messageId);
      if (!original) return;
      const kept = chatsApi.truncateAt(chat.id, messageId);
      const newUser: Message = {
        id: chatsApi.uid(),
        role: "user",
        content: newContent,
        images: original.images,
        createdAt: Date.now(),
      };
      chatsApi.appendMessage(chat.id, newUser);
      await runCompletion(chat.id, [...kept, newUser]);
    },
    [chatsApi, runCompletion, streamingId],
  );

  const handleRegenerate = useCallback(async () => {
    const chat = chatsApi.activeChat;
    if (!chat || streamingId) return;
    chatsApi.removeLastAssistant(chat.id);
    const history = chat.messages.filter(
      (m, i, arr) => !(m.role === "assistant" && i === arr.length - 1),
    );
    await runCompletion(chat.id, history);
  }, [chatsApi, runCompletion, streamingId]);

  const handleStop = () => abortRef.current?.abort();

  // Backup
  const exportAll = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      chats: chatsApi.chats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexusai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${chatsApi.chats.length} chats`);
  }, [chatsApi.chats]);

  const importAll = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const incoming: Chat[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.chats)
            ? parsed.chats
            : [];
        if (incoming.length === 0) {
          toast.error("No chats found in file");
          return;
        }
        chatsApi.importChats(incoming);
        toast.success(`Imported ${incoming.length} chats`);
      } catch {
        toast.error("Invalid backup file");
      }
    },
    [chatsApi],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k" && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        chatsApi.newChat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatsApi]);

  const sidebarNode = (closeMobile?: boolean) => (
    <Sidebar
      chats={chatsApi.chats}
      activeId={chatsApi.activeId}
      onSelect={(id) => {
        chatsApi.setActive(id);
        if (closeMobile) setMobileSidebar(false);
      }}
      onNew={() => {
        chatsApi.newChat();
        if (closeMobile) setMobileSidebar(false);
      }}
      onDelete={(id) => chatsApi.deleteChat(id)}
      onTogglePin={(id) => chatsApi.togglePin(id)}
      onOpenSettings={() => {
        if (closeMobile) setMobileSidebar(false);
        setSettingsOpen(true);
      }}
      onExportAll={exportAll}
      onImportAll={importAll}
    />
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {!sidebarHidden && <div className="hidden md:block">{sidebarNode(false)}</div>}

      <Sheet open={mobileSidebar} onOpenChange={setMobileSidebar}>
        <SheetContent
          side="left"
          className="w-[280px] border-r border-border bg-[var(--sidebar-bg)] p-0"
        >
          {sidebarNode(true)}
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col bg-[var(--chat-bg)]">
        <ChatHeader
          chat={chatsApi.activeChat}
          settings={settings}
          sessionTokens={sessionTokens}
          onRename={(t) =>
            chatsApi.activeChat && chatsApi.renameChat(chatsApi.activeChat.id, t)
          }
          onChangeModel={(model) => {
            updateSettings({ ...settings, model });
            toast.success(`Model: ${model}`);
          }}
          onToggleSidebar={() => setSidebarHidden((v) => !v)}
          sidebarHidden={sidebarHidden}
          onOpenMobileSidebar={() => setMobileSidebar(true)}
        />
        <MessageList
          chat={chatsApi.activeChat}
          streamingId={streamingId}
          awaitingFirstToken={awaitingFirstToken}
          onPickSuggestion={(t) => sendMessage(t)}
          onRegenerate={handleRegenerate}
          onEditUser={handleEditUser}
        />
        <InputBar
          ref={inputRef}
          onSend={sendMessage}
          onStop={handleStop}
          streaming={streamingId !== null}
        />
      </main>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}
