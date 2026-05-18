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
  /** Curated quick-switch options */
  models: string[];
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
    models: ["qwen3:7b", "qwen3:14b", "llama3.1:8b", "mistral:7b", "phi3:3.8b"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    label: "Cloud · Free tier",
    dot: "#3b82f6",
    endpoint: "https://openrouter.ai/api/v1",
    defaultModel: "qwen/qwen3-32b",
    modelPlaceholder: "qwen/qwen3-32b",
    requiresKey: true,
    models: [
      "qwen/qwen3-32b",
      "qwen/qwen3-235b-a22b",
      "qwen/qwen3-8b",
      "qwen/qwen-2.5-72b-instruct",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemini-2.0-flash-exp:free",
    ],
  },
  {
    id: "groq",
    name: "Groq",
    label: "Ultra-fast · Free tier",
    dot: "#a855f7",
    endpoint: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    modelPlaceholder: "llama-3.3-70b-versatile",
    requiresKey: true,
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "qwen-2.5-32b",
    ],
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
    models: [
      "Qwen/Qwen2.5-7B-Instruct-Turbo",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    ],
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
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
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
    models: [],
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
