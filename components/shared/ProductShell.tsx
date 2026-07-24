import Link from "next/link";

type ProductShellProps = {
  children: React.ReactNode;
  active?: "home" | "college" | "learn";
  title?: string;
  context?: string;
};

export function ProductShell({
  children,
  active,
  title,
  context,
}: ProductShellProps) {
  return (
    <div className="product-shell">
      <aside className="product-sidebar">
        <Link className="wordmark" href="/">
          Academia
        </Link>
        <Link className="sidebar-action" href="/learn/4p-stp">
          <span aria-hidden="true">＋</span>
          开始学习
        </Link>
        <Link
          className={`sidebar-link ${active === "home" ? "active" : ""}`}
          href="/home"
        >
          <span aria-hidden="true">⌂</span>
          今天
        </Link>
        <Link
          className={`sidebar-link ${active === "college" ? "active" : ""}`}
          href="/college/marketing"
        >
          <span aria-hidden="true">◇</span>
          学院地图
        </Link>

        <div className="sidebar-section">
          <span className="sidebar-label">最近</span>
          <Link
            className={`sidebar-link ${active === "learn" ? "active" : ""}`}
            href="/learn/4p-stp"
          >
            4P 与 STP
          </Link>
        </div>
        <div className="sidebar-spacer" />
        <Link className="sidebar-profile" href="/login">
          <span className="profile-avatar">访</span>
          <span>登录后保存进度</span>
        </Link>
      </aside>

      <main className="workspace">
        <div className="mobile-product-header">
          <Link className="wordmark" href="/">
            Academia
          </Link>
          <button aria-label="打开导航" type="button">
            ☰
          </button>
        </div>
        {(title || context) && (
          <header className="workspace-topbar">
            <div className="workspace-title">
              {title && <strong>{title}</strong>}
              {context && <span>{context}</span>}
            </div>
            <div className="workspace-actions">
              <button className="ghost-control" type="button">
                讲义
              </button>
              <button className="ghost-control" type="button">
                进度
              </button>
            </div>
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
