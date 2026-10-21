/**
 * In-memory login throttle, the same pragmatic scope as the OTP limiter in
 * lib/auth/otp.ts: single-instance deployments get real protection, while
 * multi-instance deployments should swap this Map for Redis (noted in the
 * report). Only failures are recorded, so a legitimate user is not locked out
 * by normal successful sign-ins.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 8

const failures = new Map<string, number[]>()

function recent(key: string): number[] {
   const now = Date.now()
   const hits = (failures.get(key) ?? []).filter((at) => now - at < WINDOW_MS)
   if (hits.length === 0) failures.delete(key)
   else failures.set(key, hits)
   return hits
}

/** True when this key has exhausted its failures in the current window. */
export function isLoginThrottled(key: string): boolean {
   return recent(key).length >= MAX_FAILURES
}

/** Records one wrong credential. */
export function recordLoginFailure(key: string): void {
   const hits = recent(key)
   hits.push(Date.now())
   failures.set(key, hits)
}

/** Successful sign-in clears the counter for this key. */
export function clearLoginFailures(key: string): void {
   failures.delete(key)
}
