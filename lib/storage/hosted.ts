import type { IssueStore } from "@/lib/storage/types";

// Placeholder for the hosted (Postgres-compatible) backend. The adapter
// interface is defined and selectable via PARAREPORT_STORAGE=hosted, but the
// concrete Postgres wiring is intentionally deferred — local SQLite is the only
// implemented backend for now. Every method fails loudly so a misconfigured
// hosted deployment cannot silently drop civic receipts.
export function createHostedStore(): IssueStore {
  const fail = (): never => {
    throw new Error(
      "PARAREPORT_STORAGE=hosted is not yet implemented. Use the default local SQLite backend."
    );
  };

  return new Proxy({} as IssueStore, { get: () => fail });
}
