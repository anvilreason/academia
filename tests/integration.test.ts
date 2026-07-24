import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const baseUrl = process.env.TEST_BASE_URL;

class CookieJar {
  private cookies = new Map<string, string>();

  async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (this.cookies.size) {
      headers.set(
        "cookie",
        [...this.cookies.entries()]
          .map(([name, value]) => `${name}=${value}`)
          .join("; "),
      );
    }
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    for (const value of response.headers.getSetCookie()) {
      const [pair] = value.split(";");
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const cookieValue = pair.slice(separator + 1);
      if (cookieValue) this.cookies.set(name, cookieValue);
      else this.cookies.delete(name);
    }
    return response;
  }
}

async function json<T>(response: Response) {
  return (await response.json()) as T;
}

async function registerAndSignIn(jar: CookieJar, email: string) {
  const registration = await jar.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password: "Academia2026",
      name: "集成测试学习者",
    }),
  });
  assert.equal(registration.status, 201);
  const csrf = await json<{ csrfToken: string }>(
    await jar.request("/api/auth/csrf"),
  );
  const form = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password: "Academia2026",
    json: "true",
  });
  const login = await jar.request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
    redirect: "manual",
  });
  assert.equal([200, 302, 303].includes(login.status), true);
}

test(
  "guest claim, paid access, idempotent test payment, authorization and completion",
  { skip: !baseUrl },
  async () => {
    const jar = new CookieJar();
    const trialResponse = await jar.request("/api/learning-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeSlug: "4p-stp" }),
    });
    assert.equal(trialResponse.status, 201);
    const trial = await json<{ data: { id: string } }>(trialResponse);

    const email = `integration.${Date.now()}@example.com`;
    await registerAndSignIn(jar, email);
    assert.equal(
      (await jar.request(`/api/learning-sessions/${trial.data.id}`)).status,
      200,
      "registered user must retain the anonymous trial",
    );

    const unpaid = await jar.request("/api/learning-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeSlug: "porter-five-forces" }),
    });
    assert.equal(unpaid.status, 403);

    const idempotencyKey = crypto.randomUUID();
    const createOrder = () =>
      jar.request("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nodeSlug: "porter-five-forces",
          idempotencyKey,
        }),
      });
    const orderA = await json<{ data: { id: string } }>(await createOrder());
    const orderB = await json<{ data: { id: string } }>(await createOrder());
    assert.equal(orderA.data.id, orderB.data.id);

    const confirm = () =>
      jar.request(`/api/orders/${orderA.data.id}/test-confirm`, {
        method: "POST",
      });
    assert.equal((await confirm()).status, 200);
    assert.equal((await confirm()).status, 200);

    const paidResponse = await jar.request("/api/learning-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeSlug: "porter-five-forces" }),
    });
    assert.equal(paidResponse.status, 201);
    const paid = await json<{ data: { id: string } }>(paidResponse);

    const stranger = new CookieJar();
    assert.equal(
      (await stranger.request(`/api/learning-sessions/${paid.data.id}`)).status,
      403,
    );

    const messageKey = crypto.randomUUID();
    const messageBody = JSON.stringify({
      content: "行业利润主要被上游基础模型供应商拿走，这是我的初步判断。",
      idempotencyKey: messageKey,
    });
    const stream = await jar.request(
      `/api/learning-sessions/${paid.data.id}/messages`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: messageBody,
      },
    );
    const streamText = await stream.text();
    const eventNames = [...streamText.matchAll(/^event: (.+)$/gm)].map(
      (match) => match[1],
    );
    assert.equal(eventNames.every((name) =>
      ["meta", "delta", "progress", "usage", "done", "error"].includes(name),
    ), true);
    assert.equal(
      eventNames.includes("done") || eventNames.includes("error"),
      true,
      "stream must terminate with a success or understandable failure",
    );

    execFileSync(
      "npx",
      [
        "wrangler",
        "d1",
        "execute",
        "DB",
        "--local",
        "--persist-to",
        ".wrangler/state",
        "--command",
        `UPDATE learning_sessions SET turn_count=4, progress=100 WHERE id='${paid.data.id}'`,
      ],
      { cwd: process.cwd(), stdio: "ignore" },
    );
    const completion = await jar.request(
      `/api/learning-sessions/${paid.data.id}/complete`,
      { method: "POST" },
    );
    assert.equal(completion.status, 200);
    const completed = await json<{
      data: { note: { id: string }; recommendation: { slug: string } };
    }>(completion);
    assert.ok(completed.data.note.id);
    assert.equal(
      completed.data.recommendation.slug,
      "disruptive-innovation",
    );
    assert.equal((await jar.request("/api/me/dashboard")).status, 200);
  },
);
