import type { ProviderId, Settings } from "./types";

export interface ProviderPreset {
  id: ProviderId;
  name: string;
  label: string;
  dot: string;
  endpoint: string;
  defaultModel: string;
  modelPlaceholder: string;
  requiresKey: boolean;
}

export const PROVIDERS: ProviderPreset[] = [
  {
    id: "ollama",
    name: "Ollama",
    label: "Local · Private",
    dot: "#10b981",
    endpoint: "http://localhost:11434/v1",
    defaultModel: "qwen3:7b",
    modelPlaceholder: "qwen3:7b",
    requiresKey: false,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    label: "Cloud · Free tier",
    dot: "#3b82f6",
    endpoint: "https://openrouter.ai/api/v1",
    defaultModel: "qwen/qwen3-7b",
    modelPlaceholder: "qwen/qwen3-7b",
    requiresKey: true,
  },
  {
    id: "groq",
    name: "Groq",
    label: "Ultra-fast · Free tier",
    dot: "#a855f7",
    endpoint: "https://api.groq.com/openai/v1",
    defaultModel: "llama3-70b-8192",
    modelPlaceholder: "llama3-70b-8192",
    requiresKey: true,
  },
  {
    id: "together",
    name: "Together AI",
    label: "Cloud · Pay-as-you-go",
    dot: "#eab308",
    endpoint: "https://api.together.xyz/v1",
    defaultModel: "Qwen/Qwen2.5-7B-Instruct-Turbo",
    modelPlaceholder: "Qwen/Qwen2.5-7B-Instruct-Turbo",
    requiresKey: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    label: "GPT models",
    dot: "#ef4444",
    endpoint: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    modelPlaceholder: "gpt-4o-mini",
    requiresKey: true,
  },
  {
    id: "custom",
    name: "Custom",
    label: "Any OpenAI-compatible API",
    dot: "#a3a3a3",
    endpoint: "",
    defaultModel: "",
    modelPlaceholder: "your-model-name",
    requiresKey: false,
  },
];

export const getProvider = (id: ProviderId) =>
  PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];

export const DEFAULT_SETTINGS: Settings = {
  providerId: "ollama",
  endpoint: PROVIDERS[0].endpoint,
  apiKey: "",
  model: PROVIDERS[0].defaultModel,
  systemPrompt: "",
  temperature: 0.8,
  maxTokens: 2048,
  stream: true,
};
