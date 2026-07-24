import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  BookOpenCheck,
  ExternalLink,
  Gauge,
  Link2,
  MapPinned,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import "./admin.css";

export const metadata: Metadata = {
  title: "Observatory",
  robots: { index: false, follow: false },
};

const upcoming = [
  { icon: BarChart3, label: "增长与留存", version: "V0.11" },
  { icon: BookOpenCheck, label: "学院与专业", version: "V0.12" },
  { icon: UsersRound, label: "用户", version: "V0.12" },
  { icon: MapPinned, label: "地域", version: "V0.12" },
  { icon: Link2, label: "渠道追踪", version: "V0.11" },
  { icon: ShieldCheck, label: "团队与权限", version: "V0.13" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="observatory-shell">
      <aside className="observatory-sidebar">
        <Link className="observatory-brand" href="/admin">
          <span>Academia</span>
          <strong>Observatory</strong>
        </Link>
        <nav aria-label="管理后台导航">
          <Link className="active" href="/admin">
            <Gauge aria-hidden="true" size={17} />
            总览
          </Link>
          {upcoming.map(({ icon: Icon, label, version }) => (
            <span className="upcoming" key={label}>
              <Icon aria-hidden="true" size={17} />
              {label}
              <small>{version}</small>
            </span>
          ))}
        </nav>
        <div className="observatory-sidebar-footer">
          <Link href="/">
            返回 Academia
            <ExternalLink aria-hidden="true" size={14} />
          </Link>
          <p>校务数据仅向授权成员开放</p>
        </div>
      </aside>
      <main className="observatory-main">{children}</main>
    </div>
  );
}
