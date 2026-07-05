// Federation configuration, read from the environment. Trust in this version is
// a shared-secret model: nodes that federate together share PARAREPORT_NODE_SECRET
// and sign/verify receipt envelopes with it (HMAC-SHA256). Each node still
// carries a stable PARAREPORT_NODE_ID for provenance and dedupe.

export function getNodeId(): string {
  return (process.env.PARAREPORT_NODE_ID || "local-node").trim();
}

// The shared federation signing secret. Undefined disables publishing/verifying.
export function getNodeSecret(): string | undefined {
  const secret = process.env.PARAREPORT_NODE_SECRET?.trim();
  return secret ? secret : undefined;
}

export function isSigningConfigured(): boolean {
  return getNodeSecret() !== undefined;
}

// Trusted peer base URLs to pull receipts from, e.g.
// PARAREPORT_PEERS=https://node-a.example,https://node-b.example
export function getPeers(): string[] {
  return (process.env.PARAREPORT_PEERS || "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter((url) => url.length > 0);
}
