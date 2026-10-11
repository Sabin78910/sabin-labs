/**
 * Sabin Labs ID: one end-to-end encrypted sync code shared by every web app.
 * All apps are served from the same origin (sabin78910.github.io), so a code saved here under
 * SHARED_CODE_KEY is visible to every app: sign in once, synced everywhere.
 */
import { DEFAULT_SYNC_URL, deriveKeys, newSyncCode, parseSyncCode, SyncClient } from "./sync";

export const SHARED_CODE_KEY = "sabin-labs-sync-code";

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readCode(storage: KV | undefined): string | null {
  try {
    const c = storage?.getItem(SHARED_CODE_KEY) ?? null;
    return c && parseSyncCode(c) ? c : null;
  } catch {
    return null;
  }
}

export function saveCode(storage: KV | undefined, code: string | null): void {
  try {
    if (code) storage?.setItem(SHARED_CODE_KEY, code);
    else storage?.removeItem(SHARED_CODE_KEY);
  } catch {
    /* storage blocked: the code stays in memory for this visit */
  }
}

export function createCode(): string {
  return newSyncCode();
}

/** Short, non-secret label for showing which code is active (the space id prefix only). */
export function codeLabel(code: string): string {
  const p = parseSyncCode(code);
  return p ? `SL-${p.spaceId.slice(0, 4).toUpperCase()}-${p.spaceId.slice(4, 8).toUpperCase()}` : "";
}

export type AppSync = "synced" | "not-yet" | "error";

/** Checks whether an app has synced data under this code (reads only; decrypts locally). */
export async function appSyncState(code: string, appId: string, fetchImpl?: typeof fetch): Promise<{ state: AppSync; version?: number }> {
  try {
    const client = new SyncClient(code, appId, DEFAULT_SYNC_URL, fetchImpl);
    const doc = await client.pull();
    return doc ? { state: "synced", version: doc.version } : { state: "not-yet" };
  } catch {
    return { state: "error" };
  }
}

/** Permanently erases every app's data stored under this code. */
export async function eraseAll(code: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const p = parseSyncCode(code);
  if (!p) return false;
  const { authToken } = await deriveKeys(p.secret);
  const res = await fetchImpl(`${DEFAULT_SYNC_URL}/v1/spaces/${p.spaceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return res.ok || res.status === 404;
}
