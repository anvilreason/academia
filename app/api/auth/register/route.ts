import { clearGuestId, getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { getRepository } from "@/lib/repositories";
import { hashPassword, validatePassword } from "@/lib/security/password";
import {
  authSubjectHash,
  authWindowKey,
} from "@/lib/security/auth-rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const name = body.name?.trim() ?? "";
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return apiError("BAD_REQUEST", "请输入有效邮箱", 400);
    }
    if (name.length > 40) {
      return apiError("BAD_REQUEST", "称呼不能超过 40 个字", 400);
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return apiError("BAD_REQUEST", passwordError, 400);
    }

    const repository = getRepository();
    const allowed = await repository.consumeAuthRateLimit({
      action: "register",
      subjectHash: await authSubjectHash(request, email),
      windowKey: authWindowKey(60),
      limit: 5,
    });
    if (!allowed) {
      return apiError(
        "RATE_LIMITED",
        "注册尝试过于频繁，请一小时后再试",
        429,
      );
    }
    if (await repository.findUserByEmail(email)) {
      return apiError("CONFLICT", "该邮箱已经注册，请直接登录", 409);
    }
    const { hash, salt, iterations, algorithm } =
      await hashPassword(password);
    const actor = await getActor(request);
    const user = await repository.createUser({
      email,
      passwordHash: hash,
      passwordSalt: salt,
      passwordIterations: iterations,
      passwordAlgorithm: algorithm,
      name,
    });
    if (actor.guestId) {
      await repository.claimGuestSessions(actor.guestId, user.id);
      await clearGuestId();
    }
    return apiData(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return apiError("CONFLICT", "该邮箱已经注册，请直接登录", 409);
    }
    console.error("register_failed", error);
    return apiError("INTERNAL_ERROR", "暂时无法注册，请稍后再试", 500);
  }
}
