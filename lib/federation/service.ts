import { getStore } from "@/lib/storage";
import type {
  FederationPeerStatus,
  FederationStatus,
  ReceiptEnvelope
} from "@/types/civic";
import { getNodeId, getNodeSecret, getPeers, isSigningConfigured } from "@/lib/federation/config";
import { createEnvelope, verifyEnvelope } from "@/lib/federation/signing";
import { envelopeToIssue, issueToPayload } from "@/lib/federation/envelope";

const FEED_LIMIT = 200;
const PEER_TIMEOUT_MS = 10_000;

export type FeedResult = {
  envelopes: ReceiptEnvelope[];
  cursor: string | undefined;
};

// Signed feed of locally-authored receipts emitted after `since` (a createdAt
// bookmark). Returns an empty feed when signing is not configured, since an
// unsigned receipt cannot be trusted by a peer.
export function buildFeed(since: string | undefined, limit = FEED_LIMIT): FeedResult {
  const secret = getNodeSecret();

  if (!secret) {
    return { envelopes: [], cursor: since };
  }

  const nodeId = getNodeId();
  const issues = getStore().localIssuesSince(since, limit);
  const envelopes = issues.map((issue) => createEnvelope(nodeId, issueToPayload(issue), secret));
  const cursor = issues.length ? issues[issues.length - 1].createdAt : since;

  return { envelopes, cursor };
}

export type ImportResult = {
  imported: number;
  rejected: number;
  latestCreatedAt?: string;
};

// Verifies and imports a batch of envelopes. Invalid signatures are rejected;
// duplicates (already-imported ids) are silently skipped. `latestCreatedAt`
// advances even for duplicates so a puller's cursor keeps moving forward.
export function importEnvelopes(envelopes: ReceiptEnvelope[]): ImportResult {
  const secret = getNodeSecret();
  const store = getStore();
  let imported = 0;
  let rejected = 0;
  let latestCreatedAt: string | undefined;

  for (const envelope of envelopes) {
    if (!secret || !verifyEnvelope(envelope, secret)) {
      rejected += 1;
      continue;
    }

    if (!latestCreatedAt || envelope.payload.createdAt > latestCreatedAt) {
      latestCreatedAt = envelope.payload.createdAt;
    }

    const issue = envelopeToIssue(envelope);

    if (store.upsertRemote(issue)) {
      imported += 1;
    }
  }

  return { imported, rejected, latestCreatedAt };
}

// Pulls receipts from each configured peer since the last stored cursor, tol-
// erating peers that are offline or erroring. Advances each peer's cursor only
// on a successful pull, so an outage simply resumes next time.
export async function syncWithPeers(): Promise<FederationPeerStatus[]> {
  const store = getStore();
  const peers = getPeers();
  const results: FederationPeerStatus[] = [];

  for (const peer of peers) {
    const cursor = store.getPeerCursor(peer);

    try {
      const url = new URL(`${peer}/api/federation/receipts`);

      if (cursor) {
        url.searchParams.set("since", cursor);
      }

      const response = await fetch(url, { signal: AbortSignal.timeout(PEER_TIMEOUT_MS) });

      if (!response.ok) {
        results.push({ url: peer, reachable: false, imported: 0, error: `HTTP ${response.status}` });
        continue;
      }

      const body = (await response.json()) as { envelopes?: ReceiptEnvelope[] };
      const result = importEnvelopes(body.envelopes ?? []);

      if (result.latestCreatedAt) {
        store.setPeerCursor(peer, result.latestCreatedAt);
      }

      results.push({
        url: peer,
        reachable: true,
        imported: result.imported,
        lastCursor: result.latestCreatedAt ?? cursor
      });
    } catch (error) {
      results.push({
        url: peer,
        reachable: false,
        imported: 0,
        error: error instanceof Error ? error.message : "unreachable"
      });
    }
  }

  return results;
}

export function getFederationStatus(): FederationStatus {
  const store = getStore();

  return {
    nodeId: getNodeId(),
    signingConfigured: isSigningConfigured(),
    localReceipts: store.countByOrigin("local"),
    remoteReceipts: store.countByOrigin("remote"),
    peers: getPeers()
  };
}
