"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

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
      window.location.href = continueTo || "/home";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <span className="test-badge">公开测试环境</span>
      <h1>{mode === "register" ? "保存你的认知地图" : "继续你的学习"}</h1>
      <p>
        {mode === "register"
          ? "创建预览账户后，刚才的匿名试听会话会自动保留。"
          : "登录后继续最近的课程、笔记与进度。"}
      </p>
      <form onSubmit={submit}>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="name">称呼（可选）</label>
            <input
              autoComplete="name"
              id="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="你希望导师怎么称呼你"
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
        {error && <div className="form-error">{error}</div>}
        <button
          className="button button-dark button-block"
          disabled={busy}
          type="submit"
        >
          {busy
            ? "正在处理…"
            : mode === "register"
              ? "注册并保存会话"
              : "登录"}
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
        {mode === "register" ? "已有账户？直接登录" : "第一次来？创建预览账户"}
      </button>
      <small>请勿使用重要密码；预览账户暂不发送验证邮件。</small>
    </section>
  );
}
