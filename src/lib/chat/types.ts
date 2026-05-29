export type Role = "system" | "user" | "assistant";

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  /** Data-URL images attached to a user message (multimodal) */
  images?: string[];
  createdAt: number;
  usage?: TokenUsage;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: Message[];
}

export type ProviderId = "ollama" | "openrouter" | "groq" | "together" | "openai" | "custom";

export interface Settings {
  providerId: ProviderId;
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
}
