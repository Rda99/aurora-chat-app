import { useEffect, useRef, useState } from "react";
import type { Chat, Message } from "@/lib/chat/types";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyState } from "./EmptyState";
import { ArrowDown } from "lucide-react";

interface Props {
  chat: Chat | null;
  streamingId: string | null;
  awaitingFirstToken: boolean;
  onPickSuggestion: (text: string) => void;
  onRegenerate: () => void;
  onEditUser: (messageId: string, newContent: string) => void;
}

export function MessageList({
  chat,
  streamingId,
  awaitingFirstToken,
  onPickSuggestion,
  onRegenerate,
  onEditUser,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const messages: Message[] = chat?.messages ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, awaitingFirstToken, atBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distance < 40);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  if (!chat || messages.length === 0) {
    return (
      <div className="relative flex-1 overflow-hidden">
        <EmptyState onPick={onPickSuggestion} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={scrollRef} onScroll={onScroll} className="scrollbar-thin h-full overflow-y-auto">
        <div className="mx-auto max-w-[860px] pb-4 pt-2">
          {messages.map((m, i) => {
            if (m.role === "user")
              return (
                <UserMessage
                  key={m.id}
                  message={m}
                  onEdit={streamingId ? undefined : (newContent) => onEditUser(m.id, newContent)}
                />
              );
            if (m.role === "assistant") {
              const isLast = i === messages.length - 1;
              return (
                <AssistantMessage
                  key={m.id}
                  message={m}
                  streaming={streamingId === m.id}
                  onRegenerate={isLast && !streamingId ? onRegenerate : undefined}
                />
              );
            }
            return null;
          })}
          {awaitingFirstToken && <TypingIndicator />}
        </div>
      </div>
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 float-shadow hover:bg-accent"
        >
          <ArrowDown size={13} /> New message
        </button>
      )}
    </div>
  );
}
