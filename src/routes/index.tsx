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
import type { Message } from "@/lib/chat/types";

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
    async (text: string) => {
      let chatId = chatsApi.activeId;
      let baseMessages: Message[] = chatsApi.activeChat?.messages ?? [];
      if (!chatId) {
        chatId = chatsApi.ensureChat(text);
        baseMessages = [];
      }
      const userMsg: Message = {
        id: chatsApi.uid(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      chatsApi.appendMessage(chatId, userMsg);
      const history = [...baseMessages, userMsg];
      await runCompletion(chatId, history);
    },
    [chatsApi, runCompletion],
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

  const handleStop = () => {
    abortRef.current?.abort();
  };

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

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!sidebarHidden && (
        <div className="hidden md:block">
          <Sidebar
            chats={chatsApi.chats}
            activeId={chatsApi.activeId}
            onSelect={(id) => chatsApi.setActive(id)}
            onNew={() => chatsApi.newChat()}
            onDelete={(id) => chatsApi.deleteChat(id)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
      )}

      {/* Mobile sidebar */}
      <Sheet open={mobileSidebar} onOpenChange={setMobileSidebar}>
        <SheetContent
          side="left"
          className="w-[280px] border-r border-border bg-[var(--sidebar-bg)] p-0"
        >
          <Sidebar
            chats={chatsApi.chats}
            activeId={chatsApi.activeId}
            onSelect={(id) => {
              chatsApi.setActive(id);
              setMobileSidebar(false);
            }}
            onNew={() => {
              chatsApi.newChat();
              setMobileSidebar(false);
            }}
            onDelete={(id) => chatsApi.deleteChat(id)}
            onOpenSettings={() => {
              setMobileSidebar(false);
              setSettingsOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <main className="flex min-w-0 flex-1 flex-col bg-[var(--chat-bg)]">
        <ChatHeader
          chat={chatsApi.activeChat}
          settings={settings}
          onRename={(t) => chatsApi.activeChat && chatsApi.renameChat(chatsApi.activeChat.id, t)}
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
