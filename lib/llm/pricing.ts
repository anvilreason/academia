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

export function canReserveDailyBudget(input: {
  reservedFen: number;
  actualFen: number;
  requestedFen: number;
  limitFen?: number;
}) {
  return (
    input.reservedFen + input.actualFen + input.requestedFen <=
    (input.limitFen ?? GLOBAL_DAILY_LIMIT_FEN)
  );
}
