export const GLOBAL_DAILY_LIMIT_FEN = 5_000;
export const MAX_OUTPUT_TOKENS = 800;
export type TokenPrice = {
  currency: "usd" | "cny";
  inputPerMillion: number;
  outputPerMillion: number;
};

const DEFAULT_TOKEN_PRICE: TokenPrice = {
  currency: "usd",
  inputPerMillion: 3,
  outputPerMillion: 15,
};

export function tokenPriceFor(provider: string, model: string): TokenPrice {
  if (provider === "kimi") {
    return {
      currency: "cny",
      // Use the K3 uncached rate as a conservative ceiling for Kimi models.
      inputPerMillion: 20,
      outputPerMillion: 100,
    };
  }
  if (provider === "openai") {
    if (model.includes("terra")) {
      return {
        currency: "usd",
        inputPerMillion: 2.5,
        outputPerMillion: 15,
      };
    }
    if (model.includes("luna")) {
      return {
        currency: "usd",
        inputPerMillion: 1,
        outputPerMillion: 6,
      };
    }
    return {
      currency: "usd",
      inputPerMillion: 5,
      outputPerMillion: 30,
    };
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
  const amount =
    (inputTokens * price.inputPerMillion +
      outputTokens * price.outputPerMillion) /
    1_000_000;
  const cny = price.currency === "cny" ? amount : amount * usdCnyRate;
  return Math.max(1, Math.ceil(cny * 100));
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
