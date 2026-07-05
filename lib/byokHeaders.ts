// Header names carrying per-visitor BYOK model config. Shared by the client
// (which sets them on report requests) and the server (which reads them). Kept
// in its own module so the client bundle never pulls in server provider code.
export const BYOK_HEADERS = {
  baseUrl: "x-parareport-model-base-url",
  model: "x-parareport-model",
  apiKey: "x-parareport-api-key"
} as const;
