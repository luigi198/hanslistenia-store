/**
 * Runs `create` once and shares its result with every caller, including
 * concurrent ones. A failed attempt is forgotten, so the next call retries.
 * For lazily opened connections and one-time setup (indexes).
 */
export function memoizeUntilSuccess<T>(
  create: () => Promise<T>,
): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= create().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}
