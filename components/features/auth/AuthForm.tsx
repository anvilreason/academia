"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { safeInternalPath } from "@/lib/security/redirect";

export function AuthForm({
  initialMode,
  continueTo,
}: {
  initialMode: "register" | "login";
  continueTo?: string;
}) {
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        if (password !== passwordConfirmation) {
          throw new Error("两次输入的密码不一致");
        }
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const payload = (await response.json()) as {
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(payload.error?.message || "暂时无法注册");
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("邮箱或密码不正确");
      window.location.href = safeInternalPath(continueTo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <span className="test-badge">先行校区</span>
      <h1>{mode === "register" ? "建立你的学籍" : "回到你的书院"}</h1>
      <p>
        {mode === "register"
          ? "建立学籍后，刚才的课堂对话会留在你的学习记录中。"
          : "课程、笔记和成绩都在原来的位置等你。"}
      </p>
      <form onSubmit={submit}>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="name">称呼（可选）</label>
            <input
              autoComplete="name"
              id="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="你希望在书院里使用的称呼"
              value={name}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">邮箱</label>
          <input
            autoComplete="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            id="password"
            minLength={10}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              mode === "register" ? "至少 10 位，包含字母和数字" : "输入密码"
            }
            required
            type="password"
            value={password}
          />
        </div>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="password-confirmation">再次输入密码</label>
            <input
              autoComplete="new-password"
              id="password-confirmation"
              minLength={10}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              placeholder="确认刚才输入的密码"
              required
              type="password"
              value={passwordConfirmation}
            />
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <button
          className="button button-dark button-block"
          disabled={busy}
          type="submit"
        >
          {busy
            ? "正在处理…"
            : mode === "register"
              ? "建立学籍"
              : "进入书院"}
        </button>
      </form>
      <button
        className="auth-switch"
        onClick={() => {
          setMode(mode === "register" ? "login" : "register");
          setError(null);
        }}
        type="button"
      >
        {mode === "register" ? "已有学籍？直接进入" : "第一次来？建立学籍"}
      </button>
      <small>
        密码只会以不可逆摘要保存。先行校区尚未接入邮箱验证与找回密码，请使用独立密码。
      </small>
    </section>
  );
}
