import { BYOK_HEADERS } from "@/lib/byokHeaders";

export type ByokClientConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

// sessionStorage (not localStorage): the key is dropped when the tab closes, so
// it never lingers on shared machines. It is only ever sent to the report
// analysis request via headers and is never written to the database.
const STORAGE_KEY = "parareport.byok";

export function loadByokConfig(): ByokClientConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ByokClientConfig>;

    if (!parsed.baseUrl || !parsed.model || !parsed.apiKey) {
      return null;
    }

    return { baseUrl: parsed.baseUrl, model: parsed.model, apiKey: parsed.apiKey };
  } catch {
    return null;
  }
}

export function saveByokConfig(config: ByokClientConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearByokConfig(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}

// Builds the outbound headers for a report request. Returns an empty object
// when no BYOK config is active, so default local-gemma/rules selection applies.
export function byokHeaders(config: ByokClientConfig | null): Record<string, string> {
  if (!config) {
    return {};
  }

  return {
    [BYOK_HEADERS.baseUrl]: config.baseUrl,
    [BYOK_HEADERS.model]: config.model,
    [BYOK_HEADERS.apiKey]: config.apiKey
  };
}
