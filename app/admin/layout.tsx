import type { Metadata } from "next";
import Link from "next/link";
import {
  ExternalLink,
} from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminAccess } from "@/lib/analytics/admin";
import "./admin.css";

export const metadata: Metadata = {
  title: "Observatory",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminAccess({ audit: false });
  const role = access.status === "allowed" ? access.role : null;
  return (
    <div className="observatory-shell">
      <aside className="observatory-sidebar">
        <Link className="observatory-brand" href="/admin">
          <span>Academia</span>
          <strong>Observatory</strong>
        </Link>
        <AdminNav role={role} />
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
