import type { Chat, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./providers";

const CHATS_KEY = "nexus.chats";
const SETTINGS_KEY = "nexus.settings";
const ACTIVE_KEY = "nexus.activeChatId";

const isBrowser = () => typeof window !== "undefined";

export const loadChats = (): Chat[] => {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
};

export const saveChats = (chats: Chat[]) => {
  if (!isBrowser()) return;
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
};

export const loadSettings = (): Settings => {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: Settings) => {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
};

export const loadActiveId = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_KEY);
};

export const saveActiveId = (id: string | null) => {
  if (!isBrowser()) return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
};
