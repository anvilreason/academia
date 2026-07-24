import { env } from "cloudflare:workers";

type RuntimeEnv = {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  AUTH_SECRET?: string;
  PAYMENT_MODE?: string;
  USD_CNY_RATE?: string;
};

export function runtimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}
