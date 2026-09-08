export type AiProvider = "anthropic" | "openai" | "google";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  endpoint: string;
  maxTokens: number;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: (process.env.NEXT_PUBLIC_AI_PROVIDER as AiProvider) || "anthropic",
  apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || "",
  model:
    process.env.NEXT_PUBLIC_AI_MODEL ||
    (process.env.NEXT_PUBLIC_AI_PROVIDER === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-20241022"),
  endpoint:
    process.env.NEXT_PUBLIC_AI_ENDPOINT ||
    (process.env.NEXT_PUBLIC_AI_PROVIDER === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages"),
  maxTokens: 4096,
};

export function isAiConfigured(cfg: AiConfig): boolean {
  return Boolean(cfg.apiKey);
}

export async function callAi(
  cfg: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!cfg.apiKey) {
    throw new Error("AI API key not configured. Set NEXT_PUBLIC_AI_API_KEY in .env.local");
  }

  if (cfg.provider === "anthropic") {
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
