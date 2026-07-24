import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { getProgramRecognitionAudit } from "@/lib/server/course-recognition";

export async function GET(
  request: Request,
  context: { params: Promise<{ programSlug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { programSlug } = await context.params;
  const audit = await getProgramRecognitionAudit(
    getRepository(),
    actor.userId,
    programSlug,
  );
  if (!audit) return apiError("NOT_FOUND", "专业不存在", 404);
  return apiData(audit);
}
