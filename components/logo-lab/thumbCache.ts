/**
 * Library thumbnails, cached in IndexedDB so a return visit shows them without
 * compiling a single shader. Each entry carries a hash of everything that
 * draws it (shader source + thumbnail settings), so an edited material simply
 * misses and is re-rendered. Every call fails soft: no IndexedDB (private
 * windows, blocked storage) just means no cache.
 */

const DB = "logo-lab";
const STORE = "thumbs";

interface Entry {
  hash: string;
  blob: Blob;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** Every cached thumbnail whose hash still matches. */
export async function loadThumbs(hashes: Record<string, string>): Promise<Record<string, Blob>> {
  const db = await open();
  if (!db) return {};
  return new Promise((resolve) => {
    const out: Record<string, Blob> = {};
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve(out);
        const key = String(cursor.key);
        const value = cursor.value as Entry;
        if (hashes[key] && value?.hash === hashes[key] && value.blob) out[key] = value.blob;
        cursor.continue();
      };
      req.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}

export async function saveThumb(key: string, hash: string, blob: Blob) {
  const db = await open();
  if (!db) return;
  try {
    db.transaction(STORE, "readwrite").objectStore(STORE).put({ hash, blob } satisfies Entry, key);
  } catch {
    // Quota or a closed connection: the cache is best effort.
  }
}

/** FNV-1a, base 36. Plenty to tell shader revisions apart. */
export function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + s.length.toString(36);
}
