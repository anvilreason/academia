import { getUniversityCourse } from "@/lib/content/university";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { getCourseRecognitionQuote } from "@/lib/server/course-recognition";

export async function GET(
  request: Request,
  context: { params: Promise<{ courseSlug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { courseSlug } = await context.params;
  const quote = await getCourseRecognitionQuote(
    getRepository(),
    actor.userId,
    courseSlug,
  );
  if (!quote) return apiError("NOT_FOUND", "课程不存在", 404);
  return apiData(quote);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ courseSlug: string }> },
) {
  const actor = await getActor(request);
  if (!actor.userId) return apiError("UNAUTHORIZED", "请先进入学籍账户", 401);
  const { courseSlug } = await context.params;
  const academic = getUniversityCourse(courseSlug);
  if (!academic) return apiError("NOT_FOUND", "课程不存在", 404);
  const quote = await getCourseRecognitionQuote(
    getRepository(),
    actor.userId,
    courseSlug,
  );
  if (!quote || quote.type === "none" || !quote.sourceCourseSlug) {
    return apiError("CONFLICT", "目前没有可用于互认的已修课程", 409);
  }
  if (quote.status === "completed" || quote.status === "recognized") {
    return apiData(quote);
  }
  const record = await getRepository().recordCourseRecognition({
    userId: actor.userId,
    programSlug: academic.program.slug,
    courseSlug,
    recognitionType: quote.type,
    sourceCourseSlug: quote.sourceCourseSlug,
    recognizedCredits: quote.recognizedCredits,
    remainingCredits: quote.remainingCredits,
  });
  return apiData({ ...quote, record }, { status: 201 });
}
