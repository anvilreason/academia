import { clearGuestId, getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { getRepository } from "@/lib/repositories";
import { hashPassword, validatePassword } from "@/lib/security/password";

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
    if (!EMAIL_PATTERN.test(email)) {
      return apiError("BAD_REQUEST", "请输入有效邮箱", 400);
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return apiError("BAD_REQUEST", passwordError, 400);
    }

    const repository = getRepository();
    if (await repository.findUserByEmail(email)) {
      return apiError("CONFLICT", "该邮箱已经注册，请直接登录", 409);
    }
    const { hash, salt } = await hashPassword(password);
    const actor = await getActor(request);
    const user = await repository.createUser({
      email,
      passwordHash: hash,
      passwordSalt: salt,
      name: body.name,
    });
    if (actor.guestId) {
      await repository.claimGuestSessions(actor.guestId, user.id);
      await clearGuestId();
    }
    return apiData(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    );
  } catch (error) {
    console.error("register_failed", error);
    return apiError("INTERNAL_ERROR", "暂时无法注册，请稍后再试", 500);
  }
}
