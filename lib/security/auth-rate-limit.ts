import { runtimeEnv } from "@/lib/server/env";
export { authWindowKey } from "./auth-window";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function authSubjectHash(
  request: Request,
  email: string,
) {
  const secret = runtimeEnv().AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is unavailable");
  const address =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${address}\n${email}`),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}
