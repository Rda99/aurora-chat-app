import type { Message, Settings } from "./types";

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

export interface StreamArgs {
  settings: Settings;
  messages: Message[];
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
}

export async function streamChat({
  settings,
  messages,
  signal,
  onDelta,
}: StreamArgs): Promise<void> {
  const apiMessages = [
    ...(settings.systemPrompt.trim()
      ? [{ role: "system" as const, content: settings.systemPrompt.trim() }]
      : []),
    ...messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model: settings.model,
    messages: apiMessages,
    stream: settings.stream,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  };

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

  if (!settings.stream || !res.body) {
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";
    if (content) onDelta(content);
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
    // fall through to chat-completion probe
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
