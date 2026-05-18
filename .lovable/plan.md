## Overview

Build a dark-mode AI chatbot in the existing TanStack Start + React + Tailwind project. Faithfully implements the supplied spec: three-panel shell, multi-provider OpenAI-compatible streaming, localStorage persistence, no backend.

Browser calls providers directly. Note: this requires the provider to allow CORS from the browser (OpenRouter, Groq, Together, OpenAI, custom hosts: yes; local Ollama: user must start it with `OLLAMA_ORIGINS=*`). I'll surface a clear toast if CORS blocks the request.

## Design tokens (`src/styles.css`)

Override dark theme to match spec:
- `--background: #0f0f0f`, sidebar `#161616`, chat `#1e1e1e`, bubble `#252525`
- `--primary: #00c2a8` (teal accent)
- `--border: rgba(255,255,255,0.07)`
- Radius tokens: 8 / 12 / 16 / 18px
- Inter font via Google Fonts (added to `__root.tsx` head)
- Force `.dark` class on `<html>` by default

## Routes

- `src/routes/index.tsx` — full chat app (single SPA route, app shell pattern)
- `__root.tsx` — keep, just add Inter font + `<html class="dark">` + `<Toaster />` (sonner)

## Components (`src/components/chat/`)

- `AppShell.tsx` — 3-panel flex layout, 100dvh, mobile drawer logic
- `Sidebar.tsx` — logo, New Chat button, grouped history (Today/Yesterday/Last 7/Older), settings + avatar footer
- `HistoryItem.tsx` — truncated title, hover delete with confirm popover
- `ChatHeader.tsx` — editable title, model badge, collapse trigger, export menu (.txt/.md)
- `MessageList.tsx` — auto-scroll, "↓ New message" pill when user scrolled up, fade+translate animation
- `UserMessage.tsx` — right bubble, hover timestamp
- `AssistantMessage.tsx` — no bubble, teal avatar, markdown via `react-markdown` + `remark-gfm`, code blocks via `react-syntax-highlighter` with copy button + language badge, blinking teal cursor while streaming, hover actions (thumbs up/down, copy, regenerate)
- `TypingIndicator.tsx` — 3 animated dots before first token
- `InputBar.tsx` — floating card, auto-grow textarea (1–6 lines), attach icon, web-search toggle pill, char count, send/stop button, Enter/Shift+Enter, Cmd+K focus
- `EmptyState.tsx` — centered logo + 4 suggestion prompt pills
- `SettingsModal.tsx` — provider radio cards, endpoint, masked API key with eye toggle + green check, model, system prompt, temperature slider, max tokens, stream toggle, Test Connection button, Save/Cancel, "stored locally" warning

## State & storage (`src/lib/chat/`)

- `types.ts` — `Chat`, `Message`, `Settings`, `Provider`
- `storage.ts` — localStorage read/write (guarded with `useHydrated`), keys: `nexus.chats`, `nexus.settings`, `nexus.activeChatId`
- `providers.ts` — provider presets table (Ollama, OpenRouter, Groq, Together, OpenAI, Custom) with endpoint, default model, requiresKey, extraHeaders
- `useChats.ts` — zustand-free hook: list, create, rename, delete, setActive, appendMessage, updateLastMessage
- `useSettings.ts` — load/save settings hook
- `api.ts` — `streamChat({ settings, messages, signal })` async generator using `fetch` + `ReadableStream` + `TextDecoder`, parses SSE `data:` lines, yields delta strings, handles `[DONE]`. Builds headers dynamically (Authorization only if key present; OpenRouter HTTP-Referer + X-Title). Error mapping: 401 / 429 / network → typed errors surfaced as sonner toasts.
- `testConnection.ts` — tries `GET {endpoint}/models` first, falls back to 1-token completion

## Keyboard shortcuts

Global `useEffect` listener in `index.tsx`: Cmd/Ctrl+K focuses input, Cmd/Ctrl+Shift+N starts new chat.

## Responsive

- `<768px`: sidebar becomes Sheet drawer (shadcn `Sheet`), hamburger in header, messages 90% width
- `768–1024px`: collapsible sidebar
- `≥1024px`: full 3-panel

## Dependencies to add

```
bun add react-markdown remark-gfm react-syntax-highlighter @types/react-syntax-highlighter
```

(sonner, lucide-react, all shadcn primitives, tailwind already present.)

## Explicit non-goals (matching spec)

- No backend / no Lovable Cloud / no Lovable AI Gateway
- No gradients, glows, decorative blobs, emoji UI
- No right panel
- No mock responses — real provider calls only

## Verification

After build: load app, confirm empty state renders, settings modal opens, switching providers updates endpoint, send a message against OpenRouter (if user has key) to confirm streaming + markdown + code highlighting + stop button + history persists across reload.