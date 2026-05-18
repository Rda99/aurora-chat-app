import { useCallback, useEffect, useState } from "react";
import type { Chat, Message, TokenUsage } from "./types";
import {
  loadActiveId,
  loadChats,
  saveActiveId,
  saveChats,
} from "./storage";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const c = loadChats();
    setChats(c);
    const a = loadActiveId();
    setActiveIdState(a && c.some((x) => x.id === a) ? a : null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveChats(chats);
  }, [chats, hydrated]);

  useEffect(() => {
    if (hydrated) saveActiveId(activeId);
  }, [activeId, hydrated]);

  const setActive = useCallback((id: string | null) => {
    setActiveIdState(id);
  }, []);

  const newChat = useCallback(() => {
    setActiveIdState(null);
  }, []);

  const ensureChat = useCallback((firstUserContent: string): string => {
    const id = uid();
    const title =
      firstUserContent.slice(0, 40).trim() +
      (firstUserContent.length > 40 ? "…" : "");
    const chat: Chat = {
      id,
      title: title || "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setChats((prev) => [chat, ...prev]);
    setActiveIdState(id);
    return id;
  }, []);

  const appendMessage = useCallback((chatId: string, msg: Message) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
          : c,
      ),
    );
  }, []);

  const updateMessage = useCallback(
    (chatId: string, msgId: string, content: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === msgId ? { ...m, content } : m,
                ),
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
    },
    [],
  );

  const setMessageUsage = useCallback(
    (chatId: string, msgId: string, usage: TokenUsage) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === msgId ? { ...m, usage } : m,
                ),
              }
            : c,
        ),
      );
    },
    [],
  );

  /** Truncate a chat at (and including) msgId; returns the kept history (excluding msgId). */
  const truncateAt = useCallback((chatId: string, msgId: string): Message[] => {
    let kept: Message[] = [];
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const idx = c.messages.findIndex((m) => m.id === msgId);
        if (idx < 0) return c;
        kept = c.messages.slice(0, idx);
        return { ...c, messages: kept, updatedAt: Date.now() };
      }),
    );
    return kept;
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setActiveIdState((curr) => (curr === chatId ? null : curr));
  }, []);

  const renameChat = useCallback((chatId: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)));
  }, []);

  const togglePin = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c)),
    );
  }, []);

  const removeLastAssistant = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const msgs = [...c.messages];
        const lastIdx = [...msgs].reverse().findIndex((m) => m.role === "assistant");
        if (lastIdx === -1) return c;
        msgs.splice(msgs.length - 1 - lastIdx, 1);
        return { ...c, messages: msgs };
      }),
    );
  }, []);

  const importChats = useCallback((incoming: Chat[]) => {
    setChats((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      for (const c of incoming) map.set(c.id, c);
      return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const activeChat = chats.find((c) => c.id === activeId) ?? null;

  return {
    hydrated,
    chats,
    activeId,
    activeChat,
    setActive,
    newChat,
    ensureChat,
    appendMessage,
    updateMessage,
    setMessageUsage,
    truncateAt,
    deleteChat,
    renameChat,
    togglePin,
    removeLastAssistant,
    importChats,
    uid,
  };
}
