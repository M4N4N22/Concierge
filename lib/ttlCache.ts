type CacheEntry = { expiresAt: number; value: unknown };

const values = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();

export async function withTtlCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  options?: { bypass?: boolean }
): Promise<T> {
  if (!options?.bypass) {
    const hit = values.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }
    const inflight = pending.get(key);
    if (inflight) return inflight as Promise<T>;
  }

  const task = loader()
    .then((value) => {
      values.set(key, { value, expiresAt: Date.now() + ttlMs });
      pending.delete(key);
      return value;
    })
    .catch((err) => {
      pending.delete(key);
      throw err;
    });

  pending.set(key, task);
  return task;
}

export function setTtlCache<T>(key: string, value: T, ttlMs: number): void {
  values.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateTtlCache(prefix?: string): void {
  if (!prefix) {
    values.clear();
    pending.clear();
    return;
  }
  for (const key of [...values.keys()]) {
    if (key.startsWith(prefix)) values.delete(key);
  }
  for (const key of [...pending.keys()]) {
    if (key.startsWith(prefix)) pending.delete(key);
  }
}
