import { getUniversityCourse } from "@/lib/content/university";
import { nodePriceFen } from "@/lib/domain/orders";
import { getRepository } from "@/lib/repositories";
import { getActor } from "@/lib/server/actor";
import { apiData, apiError } from "@/lib/server/api";
import { getCourseRecognitionQuote } from "@/lib/server/course-recognition";

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor.userId) {
    return apiError("UNAUTHORIZED", "请先建立学籍，再完成选课登记", 401);
  }
  const body = (await request.json()) as {
    nodeSlug?: string;
    idempotencyKey?: string;
  };
  const nodeSlug = body.nodeSlug ?? "";
  const academic = getUniversityCourse(nodeSlug);
  const quote = academic
    ? await getCourseRecognitionQuote(
        getRepository(),
        actor.userId,
        nodeSlug,
      )
    : null;
  const amountFen = quote ? quote.priceFen : nodePriceFen(nodeSlug);
  if (!amountFen || !body.idempotencyKey) {
    if (quote?.type === "full") {
      return apiError(
        "CONFLICT",
        "这门课程可以直接互认，无需重复付费",
        409,
        quote,
      );
    }
    return apiError("BAD_REQUEST", "课程或请求标识无效", 400);
  }
  const order = await getRepository().createOrder({
    userId: actor.userId,
    nodeSlug,
    amountFen,
    idempotencyKey: body.idempotencyKey,
  });
  return apiData(order, { status: 201 });
}
