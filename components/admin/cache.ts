// Per-tab cache for the admin lists: a revisit renders the last data instantly while fresh data loads.
// sessionStorage is cleared when the tab closes.
export function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(`nk-admin:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown) {
  try {
    sessionStorage.setItem(`nk-admin:${key}`, JSON.stringify(value));
  } catch {}
}
