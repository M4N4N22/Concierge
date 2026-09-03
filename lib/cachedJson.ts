import {
  invalidateTtlCache,
  withTtlCache,
} from "@/lib/ttlCache";

type CachedJsonOptions = {
  ttlMs: number;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  bypass?: boolean;
};

/**
 * Browser JSON fetch with TTL + in-flight coalescing.
 * Survives component remounts in the same tab session.
 */
export async function cachedJson<T>(
  cacheKey: string,
  url: string,
  options: CachedJsonOptions
): Promise<T> {
  return withTtlCache(
    cacheKey,
    options.ttlMs,
    async () => {
      const res = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
        body: options.body != null ? JSON.stringify(options.body) : undefined,
      });
      const data = (await res.json()) as T & { error?: string };
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      return data as T;
    },
    { bypass: options.bypass }
  );
}

export function invalidateComputeClientCache(prefix = "compute:"): void {
  invalidateTtlCache(prefix);
}
