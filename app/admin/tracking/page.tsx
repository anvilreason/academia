import { Link2, MousePointerClick, UserPlus, BookOpenCheck } from "lucide-react";
import { headers } from "next/headers";
import { TrackingLinkManager } from "@/components/admin/TrackingLinkManager";
import { AdminDenied } from "@/components/admin/AdminStates";
import {
  AdminMetric,
  AdminPageHeader,
  EmptyState,
  formatNumber,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getTrackingReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const gate = await loadAdminSection("tracking");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const report = await getTrackingReport();
  const canWrite = ["owner", "admin", "growth"].includes(gate.access.role);
  const requestHeaders = await headers();
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (requestHeaders.get("host")?.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${requestHeaders.get("host") ?? "academia.local"}`;

  return (
    <>
      <AdminPageHeader
        eyebrow="ATTRIBUTION"
        title="渠道追踪"
        description="为每次发布、合作或内容分发建立独立链接，观察它最终带来的注册与学习。"
      />
      <section className="observatory-metrics four">
        <AdminMetric
          icon={Link2}
          label="追踪链接"
          note={`${report.metrics.active} 条正在运行`}
          value={formatNumber(report.metrics.links)}
        />
        <AdminMetric
          icon={MousePointerClick}
          label="渠道访问"
          note="按链接访问者去重"
          value={formatNumber(report.metrics.visitors)}
        />
        <AdminMetric
          icon={UserPlus}
          label="带来注册"
          note="90 天第一触点归因"
          value={formatNumber(report.metrics.signups)}
        />
        <AdminMetric
          icon={BookOpenCheck}
          label="进入学习"
          note="来自追踪链接的学习者"
          value={formatNumber(report.metrics.learners)}
        />
      </section>

      <section className="observatory-panel">
        <header>
          <div>
            <span>渠道明细</span>
            <h2>链接表现</h2>
          </div>
        </header>
        <TrackingLinkManager
          baseUrl={baseUrl}
          links={report.links}
          canWrite={canWrite}
        />
        {!report.links.length && (
          <EmptyState>
            建立第一条追踪链接后，访问、注册、学习与完成选课会在这里自动归因。
          </EmptyState>
        )}
      </section>

      <p className="privacy-callout">
        归因 Cookie 有效期为 90 天，只包含渠道链接 ID、来源、媒介和活动名称，不记录跨站浏览行为。
      </p>
    </>
  );
}
