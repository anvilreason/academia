import { env } from "cloudflare:workers";
import { newId, nowIso, shanghaiDateKey } from "@/lib/server/api";

export const GLOBAL_DAILY_LIMIT_FEN = 5_000;
export const MAX_OUTPUT_TOKENS = 800;
const INPUT_USD_PER_MILLION = 3;
const OUTPUT_USD_PER_MILLION = 15;

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length * 0.8));
}

export function estimateCostFen(
  inputTokens: number,
  outputTokens: number,
  usdCnyRate = 7.2,
) {
  const usd =
    (inputTokens * INPUT_USD_PER_MILLION +
      outputTokens * OUTPUT_USD_PER_MILLION) /
    1_000_000;
  return Math.max(1, Math.ceil(usd * usdCnyRate * 100));
}

export async function reserveBudget(inputTokens: number) {
  const bindings = env as unknown as { DB: D1Database };
  const dateKey = shanghaiDateKey();
  const now = nowIso();
  const reservedFen = estimateCostFen(inputTokens, MAX_OUTPUT_TOKENS);
  const id = newId();
  const statement = bindings.DB.prepare(
    `INSERT INTO daily_cost_quotas
      (id, date_key, reserved_fen, actual_fen, limit_fen, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, 0, ?, ?, ?, NULL)
     ON CONFLICT(date_key) DO UPDATE SET
       reserved_fen = reserved_fen + excluded.reserved_fen,
       updated_at = excluded.updated_at
     WHERE daily_cost_quotas.reserved_fen + daily_cost_quotas.actual_fen + excluded.reserved_fen <= daily_cost_quotas.limit_fen
     RETURNING reserved_fen, actual_fen, limit_fen`,
  );
  const row = await statement
    .bind(
      id,
      dateKey,
      reservedFen,
      GLOBAL_DAILY_LIMIT_FEN,
      now,
      now,
    )
    .first<{ reserved_fen: number; actual_fen: number; limit_fen: number }>();
  if (!row) return null;
  return { dateKey, reservedFen };
}

export async function settleBudget(
  dateKey: string,
  reservedFen: number,
  actualFen: number,
) {
  const bindings = env as unknown as { DB: D1Database };
  await bindings.DB.prepare(
    `UPDATE daily_cost_quotas
     SET reserved_fen = MAX(0, reserved_fen - ?),
         actual_fen = actual_fen + ?,
         updated_at = ?
     WHERE date_key = ?`,
  )
    .bind(reservedFen, actualFen, nowIso(), dateKey)
    .run();
}
