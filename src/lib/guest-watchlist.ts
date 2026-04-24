/**
 * Guest watchlist — lets non-authenticated users save programs locally.
 *
 * Storage shape (versioned key):
 *   localStorage["ua.guest.watchlist.v1"] = JSON.stringify({
 *     items: Array<{ programId: string; addedAt: string }>,
 *   })
 *
 * On sign-in we merge any local items into the authenticated saved list and
 * then clear local storage (see `mergeGuestWatchlistInto`).
 */

const STORAGE_KEY = "ua.guest.watchlist.v1";
const MAX_ENTRIES = 50;
const CHANGE_EVENT = "ua:guest-watchlist-change";

export interface GuestWatchlistEntry {
  programId: string;
  addedAt: string;
}

interface Stored {
  items: GuestWatchlistEntry[];
}

function read(): Stored {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return { items: parsed.items.filter((i) => i && typeof i.programId === "string") };
  } catch {
    return { items: [] };
  }
}

function write(state: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // Storage may be full or disabled (private mode). Silently no-op.
  }
}

export function getGuestWatchlist(): GuestWatchlistEntry[] {
  return read().items;
}

export function getGuestWatchlistIds(): string[] {
  return read().items.map((i) => i.programId);
}

export function isInGuestWatchlist(programId: string): boolean {
  return read().items.some((i) => i.programId === programId);
}

export function addToGuestWatchlist(programId: string): boolean {
  const state = read();
  if (state.items.some((i) => i.programId === programId)) return false;
  if (state.items.length >= MAX_ENTRIES) {
    // Drop the oldest to make room.
    state.items.shift();
  }
  state.items.push({ programId, addedAt: new Date().toISOString() });
  write(state);
  return true;
}

export function removeFromGuestWatchlist(programId: string): boolean {
  const state = read();
  const next = state.items.filter((i) => i.programId !== programId);
  if (next.length === state.items.length) return false;
  write({ items: next });
  return true;
}

export function clearGuestWatchlist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function getGuestWatchlistCount(): number {
  return read().items.length;
}

/** Subscribe to guest-watchlist changes (cross-tab via `storage` + same-tab custom event). */
export function subscribeToGuestWatchlist(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}