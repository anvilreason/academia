import { env } from "cloudflare:workers";
import { newId, nowIso, shanghaiDateKey } from "@/lib/server/api";
import {
  estimateCostFen,
  GLOBAL_DAILY_LIMIT_FEN,
  MAX_OUTPUT_TOKENS,
  type TokenPrice,
} from "./pricing";

export {
  estimateCostFen,
  estimateTokens,
  GLOBAL_DAILY_LIMIT_FEN,
  MAX_OUTPUT_TOKENS,
} from "./pricing";

export async function reserveBudget(
  inputTokens: number,
  input: { usdCnyRate?: number; tokenPrice?: TokenPrice } = {},
) {
  const bindings = env as unknown as { DB: D1Database };
  const dateKey = shanghaiDateKey();
  const now = nowIso();
  const reservedFen = estimateCostFen(
    inputTokens,
    MAX_OUTPUT_TOKENS,
    input.usdCnyRate,
    input.tokenPrice,
  );
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
