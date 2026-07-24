export function authWindowKey(minutes: number, now = Date.now()) {
  return String(Math.floor(now / (minutes * 60_000)));
}
