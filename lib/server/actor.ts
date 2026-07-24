import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { newId } from "./api";
import { runtimeEnv } from "./env";

const GUEST_COOKIE = "academia_guest";

export async function getActor(request: Request) {
  const token = await getToken({
    req: request,
    secret: runtimeEnv().AUTH_SECRET,
    secureCookie: new URL(request.url).protocol === "https:",
  });
  if (token?.sub) {
    return { userId: token.sub, guestId: null };
  }
  const store = await cookies();
  return {
    userId: null,
    guestId: store.get(GUEST_COOKIE)?.value ?? null,
  };
}

export async function ensureGuestId() {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const guestId = newId();
  store.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return guestId;
}

export async function clearGuestId() {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}
