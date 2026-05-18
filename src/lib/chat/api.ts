import type { Message, Settings, TokenUsage } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const buildHeaders = (settings: Settings): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (settings.apiKey.trim()) {
    headers["Authorization"] = `Bearer ${settings.apiKey.trim()}`;
  }
  if (settings.providerId === "openrouter") {
    if (typeof window !== "undefined") {
      headers["HTTP-Referer"] = window.location.origin;
    }
    headers["X-Title"] = "NexusAI";
  }
  return headers;
};

const endpointUrl = (settings: Settings, path: string) => {
  const base = settings.endpoint.replace(/\/+$/, "");
  return `${base}${path}`;
};

type ApiContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

// Heuristic: which model slugs accept multimodal image_url content.
export const isVisionModel = (model: string): boolean => {
  const m = model.toLowerCase();
  return (
    /gpt-4o|gpt-4\.1|o1|o3|o4/.test(m) ||
    /claude-3|claude-4|claude-opus|claude-sonnet|claude-haiku/.test(m) ||
    /gemini/.test(m) ||
    /llava|bakllava|moondream|cogvlm|minicpm-v/.test(m) ||
    /llama-?3\.2-(11|90)b.*vision|llama-?4|scout|maverick/.test(m) ||
    /qwen.*vl|qwen2?-?vl|qwen3-vl/.test(m) ||
    /pixtral/.test(m) ||
    /vision/.test(m)
  );
};

const toApiContent = (m: Message, vision: boolean): ApiContent => {
  if (m.role === "user" && m.images && m.images.length > 0) {
    if (vision) {
      return [
        { type: "text", text: m.content },
        ...m.images.map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        })),
      ];
    }
    // Strip images for text-only models so the API doesn't 400.
    const note = `[${m.images.length} image attachment${m.images.length > 1 ? "s" : ""} omitted — current model has no vision support]`;
    return m.content ? `${m.content}\n\n${note}` : note;
  }
  return m.content;
};

export interface StreamArgs {
  settings: Settings;
  messages: Message[];
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
  onUsage?: (usage: TokenUsage) => void;
}

export async function streamChat({
  settings,
  messages,
  signal,
  onDelta,
  onUsage,
}: StreamArgs): Promise<void> {
  const apiMessages = [
    ...(settings.systemPrompt.trim()
      ? [{ role: "system" as const, content: settings.systemPrompt.trim() }]
      : []),
    ...messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: toApiContent(m) })),
  ];

  const body: Record<string, unknown> = {
    model: settings.model,
    messages: apiMessages,
    stream: settings.stream,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  };
  if (settings.stream) {
    body.stream_options = { include_usage: true };
  }

  let res: Response;
  try {
    res = await fetch(endpointUrl(settings, "/chat/completions"), {
      method: "POST",
      headers: buildHeaders(settings),
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    throw new ApiError(0, (e as Error).message || "Network error");
  }

  if (!res.ok) {
    let txt = "";
    try {
      txt = await res.text();
    } catch {
      // ignore
    }
    throw new ApiError(res.status, txt || `HTTP ${res.status}`);
  }

  const parseUsage = (raw: any) => {
    const u = raw?.usage;
    if (!u || !onUsage) return;
    onUsage({
      prompt: u.prompt_tokens ?? 0,
      completion: u.completion_tokens ?? 0,
      total: u.total_tokens ?? (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0),
    });
  };

  if (!settings.stream || !res.body) {
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";
    if (content) onDelta(content);
    parseUsage(json);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) onDelta(delta);
        parseUsage(parsed);
      } catch {
        // ignore parse errors mid-stream
      }
    }
  }
}

export async function testConnection(settings: Settings): Promise<void> {
  try {
    const res = await fetch(endpointUrl(settings, "/models"), {
      method: "GET",
      headers: buildHeaders(settings),
    });
    if (res.ok) return;
    if (res.status === 401) throw new ApiError(401, "Invalid API key");
  } catch (e) {
    if (e instanceof ApiError) throw e;
  }

  const res = await fetch(endpointUrl(settings, "/chat/completions"), {
    method: "POST",
    headers: buildHeaders(settings),
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => `HTTP ${res.status}`));
  }
}
