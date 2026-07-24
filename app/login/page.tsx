import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <header className="simple-header">
        <Link className="wordmark" href="/">
          Academia
        </Link>
        <Link className="text-link" href="/">
          返回首页
        </Link>
      </header>
      <section className="auth-card">
        <span className="test-badge">公开测试环境</span>
        <h1 style={{ marginTop: 18 }}>保存你的认知地图</h1>
        <p>v0.3 将开放真实注册。当前页面仅用于确认产品结构。</p>
        <div className="field">
          <label htmlFor="email">邮箱</label>
          <input disabled id="email" placeholder="you@example.com" type="email" />
        </div>
        <div className="field">
          <label htmlFor="password">密码</label>
          <input disabled id="password" placeholder="至少 10 位" type="password" />
        </div>
        <button
          className="button button-dark button-block"
          disabled
          type="button"
        >
          v0.3 开放注册
        </button>
      </section>
    </main>
  );
}
