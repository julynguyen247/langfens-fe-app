export type AiProvider = "server-proxy" | "anthropic" | "openai" | "google";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  endpoint: string;
  maxTokens: number;
}

export interface AutogenContext {
  type: string;
  skill: string;
  count: number;
  difficulty: number;
  passage?: string;
  extraContext?: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: (process.env.NEXT_PUBLIC_AI_PROVIDER as AiProvider) || "server-proxy",
  apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || "",
  model:
    process.env.NEXT_PUBLIC_AI_MODEL ||
    (process.env.NEXT_PUBLIC_AI_PROVIDER === "openai"
      ? "gpt-4o-mini"
      : process.env.NEXT_PUBLIC_AI_PROVIDER === "anthropic"
      ? "claude-3-5-sonnet-20241022"
      : ""),
  endpoint:
    process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
    process.env.NEXT_PUBLIC_AI_ENDPOINT ||
    (process.env.NEXT_PUBLIC_GATEWAY_URL
      ? `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api-ai`
      : "http://localhost:5000/api-ai"),
  maxTokens: 4096,
};

export function isAiConfigured(cfg: AiConfig): boolean {
  if (cfg.provider === "server-proxy") return Boolean(cfg.endpoint);
  return Boolean(cfg.apiKey);
}

export async function callAi(
  cfg: AiConfig,
  systemPrompt: string,
  userPrompt: string,
  context?: AutogenContext
): Promise<string> {
  if (cfg.provider === "server-proxy") {
    if (!cfg.endpoint) {
      throw new Error("Server-proxy endpoint not configured. Set NEXT_PUBLIC_AI_SERVICE_URL or NEXT_PUBLIC_GATEWAY_URL.");
    }
    const base = cfg.endpoint.replace(/\/+$/, "");
    const url = base.endsWith("/api-ai") || base.endsWith("/api")
      ? `${base}/v1/autogen/questions`
      : `${base}/api/v1/autogen/questions`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: context?.type ?? "MULTIPLE_CHOICE_SINGLE",
        skill: context?.skill ?? "READING",
        passage: context?.passage ?? userPrompt,
        count: context?.count ?? 1,
        difficulty: context?.difficulty ?? 3,
        extra_context: context?.extraContext ?? "",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ai-service ${res.status}: ${err}`);
    }
    const data = await res.json();
    return JSON.stringify(data.questions ?? []);
  }

  if (cfg.provider === "anthropic") {
    if (!cfg.apiKey) {
      throw new Error("AI API key not configured. Set NEXT_PUBLIC_AI_API_KEY in .env.local");
    }
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data?.content?.[0]?.text || "";
  }

  if (cfg.provider === "openai") {
    if (!cfg.apiKey) {
      throw new Error("AI API key not configured. Set NEXT_PUBLIC_AI_API_KEY in .env.local");
    }
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  throw new Error(`Unsupported AI provider: ${cfg.provider}`);
}

export function tryParseLlmJson(text: string): unknown[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const tryParse = (s: string): unknown | null => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  let parsed = tryParse(withoutFences);
  if (parsed == null) {
    const match = withoutFences.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) parsed = tryParse(match[1]);
  }
  if (parsed == null) return null;
  return Array.isArray(parsed) ? parsed : [parsed];
}
