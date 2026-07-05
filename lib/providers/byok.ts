import type { ByokConfig } from "@/lib/providers/types";
import { BYOK_HEADERS } from "@/lib/byokHeaders";

export { BYOK_HEADERS };

// Extracts a per-visitor BYOK config from request headers. Returns undefined
// unless a usable base URL + model + key are all present. The key is read here
// and passed straight to the outbound model call; it is never written to the
// database, logs, or federation payloads.
export function readByokConfig(headers: Headers): ByokConfig | undefined {
  const baseUrl = headers.get(BYOK_HEADERS.baseUrl)?.trim();
  const model = headers.get(BYOK_HEADERS.model)?.trim();
  const apiKey = headers.get(BYOK_HEADERS.apiKey)?.trim();

  if (!baseUrl || !model || !apiKey) {
    return undefined;
  }

  if (!isSafeHttpUrl(baseUrl)) {
    console.error("Ignoring BYOK config with non-http(s) base URL");
    return undefined;
  }

  return { baseUrl, model, apiKey };
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
