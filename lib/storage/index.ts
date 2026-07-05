import { LocalSqliteStore } from "@/lib/storage/localSqlite";
import { createHostedStore } from "@/lib/storage/hosted";
import type { IssueStore } from "@/lib/storage/types";

const globalStore = globalThis as unknown as { __parareportStore?: IssueStore };

// Selects the storage backend once per process. `local` (SQLite) is the default
// for cloned/local nodes; `hosted` targets external Postgres-compatible storage
// on deployments like Vercel.
export function getStore(): IssueStore {
  if (!globalStore.__parareportStore) {
    globalStore.__parareportStore = createStore();
  }

  return globalStore.__parareportStore;
}

function createStore(): IssueStore {
  const kind = (process.env.PARAREPORT_STORAGE || "local").toLowerCase();

  if (kind === "hosted") {
    return createHostedStore();
  }

  return new LocalSqliteStore();
}

export type { IssueStore, ListFilters, ClusterCandidate } from "@/lib/storage/types";
