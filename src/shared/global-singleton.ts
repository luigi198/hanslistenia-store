const store = globalThis as typeof globalThis & {
  __hanslisteniaSingletons?: Map<string, unknown>;
};

/**
 * One value per key per server instance. Kept on globalThis so Next.js dev hot
 * reloads (which re-evaluate modules) reuse clients instead of leaking pools.
 * A throwing factory caches nothing, so the next call retries.
 */
export function globalSingleton<T>(key: string, create: () => T): T {
  const registry = (store.__hanslisteniaSingletons ??= new Map());
  // The registry is heterogeneous; each key is only ever written by its own
  // typed call site, so narrowing back to T here is sound.
  if (registry.has(key)) return registry.get(key) as T;
  const value = create();
  registry.set(key, value);
  return value;
}
