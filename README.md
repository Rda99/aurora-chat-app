# NexusAI Chat

A fast, multi-provider AI chat interface built with React, TanStack Start, and Tailwind CSS. Connect to any OpenAI-compatible API — from local Ollama models to cloud providers like OpenRouter, Groq, OpenAI, and more.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react)
![Tech Stack](https://img.shields.io/badge/TanStack_Start-v1-blue?logo=react)
![Tech Stack](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)

## Features

- **Multi-Provider Support** — Switch between Ollama, OpenRouter, Groq, Together AI, OpenAI, or any custom OpenAI-compatible endpoint.
- **Local-First Chat History** — All conversations and settings are stored in the browser's `localStorage`; no backend required.
- **Vision Models** — Upload images and chat with vision-capable models (GPT-4o, Claude 3.5, Gemini, Llama 3.2 Vision, Qwen-VL, etc.). Non-vision models gracefully degrade with a text placeholder.
- **Voice Input** — Use your microphone to dictate messages via the browser's SpeechRecognition API.
- **Token Usage Tracking** — See prompt, completion, and total token counts for each assistant response.
- **Edit & Resend** — Click **Edit** on any user message to modify it and re-send from that point in the thread.
- **Pinned Chats** — Pin important conversations to the top of the sidebar.
- **Sidebar Search** — Quickly find chats by title or message content.
- **Import / Export** — Back up and restore your chats and settings as JSON files.
- **Streaming Responses** — Real-time token streaming with a typing indicator.
- **Markdown & Syntax Highlighting** — Rich rendering for code blocks, tables, lists, and inline formatting.

## Supported Providers

| Provider | Endpoint | Requires API Key | Notes |
|----------|----------|------------------|-------|
| **Ollama** | `http://localhost:11434/v1` | No | Run models locally |
| **OpenRouter** | `https://openrouter.ai/api/v1` | Yes | Access 200+ models, free tier available |
| **Groq** | `https://api.groq.com/openai/v1` | Yes | Ultra-fast inference, free tier |
| **Together AI** | `https://api.together.xyz/v1` | Yes | Pay-as-you-go |
| **OpenAI** | `https://api.openai.com/v1` | Yes | GPT-4o, GPT-4o-mini, etc. |
| **Custom** | Any URL | Optional | Any OpenAI-compatible API |

## Quick Start

```bash
# Install dependencies
bun install

# Start the dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and configure your provider in **Settings**.

## Configuration

1. Click the **Settings** icon in the header (or sidebar on mobile).
2. Select your **Provider**.
3. Enter your **API Key** (if required).
4. Choose a **Model** from the curated list or type your own.
5. Adjust **Temperature**, **Max Tokens**, and **System Prompt** as needed.

### Recommended OpenRouter Models

- `qwen/qwen3-32b` — Fast, capable Qwen model
- `anthropic/claude-3.5-sonnet` — Strong reasoning and coding
- `openai/gpt-4o-mini` — Cheap and fast general purpose
- `google/gemini-2.0-flash-exp:free` — Free tier, good for prototyping
- `meta-llama/llama-3.3-70b-instruct` — Open-weight, high quality

## Project Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── AssistantMessage.tsx   # Assistant bubble with actions
│   │   ├── ChatHeader.tsx         # Top bar with model switcher
│   │   ├── EmptyState.tsx         # Welcome screen with suggestions
│   │   ├── InputBar.tsx           # Text input + image upload + mic
│   │   ├── Logo.tsx               # App logo SVG
│   │   ├── Markdown.tsx           # Markdown renderer with code highlighting
│   │   ├── MessageList.tsx        # Scrollable message feed
│   │   ├── SettingsModal.tsx      # Provider & model configuration
│   │   ├── Sidebar.tsx            # Chat list, search, pin, new chat
│   │   ├── TypingIndicator.tsx    # Animated dots while waiting
│   │   └── UserMessage.tsx        # User bubble with edit action
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   └── chat/
│       ├── api.ts                 # Streaming chat API client
│       ├── providers.ts           # Provider presets & defaults
│       ├── storage.ts             # localStorage persistence
│       ├── types.ts               # Chat, Message, Settings types
│       ├── useChats.ts            # Chat state management hook
│       └── useSettings.ts         # Settings state management hook
├── routes/
│   ├── __root.tsx                 # Root layout
│   └── index.tsx                  # Main chat page
├── styles.css                     # Tailwind v4 theme tokens
└── ...
```

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19, SSR, file-based routing)
- **Styling:** Tailwind CSS v4 with CSS variables
- **UI Primitives:** Radix UI + shadcn/ui
- **Icons:** Lucide React
- **Markdown:** react-markdown + react-syntax-highlighter + remark-gfm
- **Build Tool:** Vite 7

## Building for Production

```bash
bun run build
```

The output is optimized for edge deployment (Cloudflare Workers compatible).

## Data Privacy

- All API keys are stored **locally in your browser** (`localStorage`).
- Chat history never leaves your device.
- No telemetry, tracking, or external analytics.
- Safe to deploy publicly — nothing sensitive ships with the build.

## License

MIT
