export const GLOBAL_DAILY_LIMIT_FEN = 5_000;
export const MAX_OUTPUT_TOKENS = 800;
export type TokenPrice = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

const DEFAULT_TOKEN_PRICE: TokenPrice = {
  inputUsdPerMillion: 3,
  outputUsdPerMillion: 15,
};

export function tokenPriceFor(provider: string, model: string): TokenPrice {
  if (provider === "openai") {
    if (model.includes("terra")) {
      return { inputUsdPerMillion: 2.5, outputUsdPerMillion: 15 };
    }
    if (model.includes("luna")) {
      return { inputUsdPerMillion: 1, outputUsdPerMillion: 6 };
    }
    return { inputUsdPerMillion: 5, outputUsdPerMillion: 30 };
  }
  return DEFAULT_TOKEN_PRICE;
}

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length * 0.8));
}

export function estimateCostFen(
  inputTokens: number,
  outputTokens: number,
  usdCnyRate = 7.2,
  price = DEFAULT_TOKEN_PRICE,
) {
  const usd =
    (inputTokens * price.inputUsdPerMillion +
      outputTokens * price.outputUsdPerMillion) /
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
