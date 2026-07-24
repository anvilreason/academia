import { apiError } from "@/lib/server/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params;
  return apiError(
    "CONFLICT",
    "课程学分必须由期末考试结算，请进入考试流程",
    409,
  );
}
