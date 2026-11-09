/**
 * Counts admin login attempts per key in fixed time windows.
 * Keys are opaque, already-hashed strings — implementations never see raw
 * IPs. An attempt opens a window of `windowMs` if none is open; when it
 * closes, the count resets.
 */
export interface LoginAttemptStore {
  /**
   * Atomically adds one attempt for `key` in the window open at `now`
   * (opening one if needed) and returns the new count. Must be atomic across
   * concurrent callers and server instances, or the limit can be raced.
   */
  registerAttempt(key: string, now: Date, windowMs: number): Promise<number>;
  clearAttempts(key: string): Promise<void>;
}
