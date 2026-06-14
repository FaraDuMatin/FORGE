// Device-local memory of the projects you maintain. FORGE has no accounts — the
// secret manage token lives in the URL — so to let a returning maintainer get
// back in without digging up the link, we remember it on THIS device only.
// Never sent to a server. Holds a LIST (not one project): manage many, switch
// freely, remove any. Pure / client-safe.
//
// Exposed as an external store (subscribe + snapshot) so React components can
// read it via useSyncExternalStore — SSR-safe (server snapshot is empty) and
// reactive to add/remove without effects.

const KEY = "forge.myProjects";

export type MyProject = { slug: string; title: string; token: string; at: number };

const EMPTY: MyProject[] = [];
let cache: MyProject[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): MyProject[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as MyProject[];
    if (!Array.isArray(parsed)) return EMPTY;
    const clean = parsed.filter((p) => p && typeof p.slug === "string" && typeof p.token === "string");
    return clean.sort((a, b) => b.at - a.at);
  } catch {
    return EMPTY;
  }
}

function write(next: MyProject[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full / blocked — fail quietly
  }
  cache = null; // invalidate; next snapshot re-reads
  for (const l of listeners) l();
}

// --- external-store API (for useSyncExternalStore) ---

export function subscribeMyProjects(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Cached so repeated calls return a stable reference until the data changes
// (useSyncExternalStore requires this to avoid infinite re-renders).
export function getMyProjectsSnapshot(): MyProject[] {
  if (cache === null) cache = readStorage();
  return cache;
}

export function getMyProjectsServerSnapshot(): MyProject[] {
  return EMPTY;
}

// --- mutations ---

// Add or update an entry, keyed by slug (revisiting refreshes title/token/time).
export function rememberMyProject(p: Omit<MyProject, "at">): void {
  if (typeof window === "undefined") return;
  if (!p.slug || !p.token) return;
  const next = readStorage().filter((x) => x.slug !== p.slug);
  next.unshift({ ...p, at: Date.now() });
  write(next);
}

export function forgetMyProject(slug: string): void {
  if (typeof window === "undefined") return;
  write(readStorage().filter((x) => x.slug !== slug));
}
