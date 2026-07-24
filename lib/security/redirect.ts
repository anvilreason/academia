export function safeInternalPath(
  value: string | undefined,
  fallback = "/home",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}
