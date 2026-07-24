import { KeyRound, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import { TeamManager } from "@/components/admin/TeamManager";
import { AdminDenied } from "@/components/admin/AdminStates";
import {
  AdminMetric,
  AdminPageHeader,
  formatDateTime,
  formatNumber,
} from "@/components/admin/AdminPrimitives";
import {
  adminRoleLabel,
  canAccessAdminSection,
  type AdminRole,
  type AdminSection,
} from "@/lib/analytics/admin-permissions";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getTeamReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

const roles: AdminRole[] = [
  "admin",
  "growth",
  "operations",
  "analyst",
  "viewer",
];
const sections: Array<{ key: AdminSection; label: string }> = [
  { key: "overview", label: "总览" },
  { key: "growth", label: "增长留存" },
  { key: "academics", label: "学院专业" },
  { key: "users", label: "用户" },
  { key: "geo", label: "地域" },
  { key: "tracking", label: "渠道" },
  { key: "team", label: "团队权限" },
];

const actionLabels: Record<string, string> = {
  "team.add": "添加成员",
  "team.update": "调整成员权限",
  "tracking.create": "建立追踪链接",
  "tracking.status": "调整追踪链接状态",
  "overview.view": "查看总览",
  "growth.view": "查看增长留存",
  "academics.view": "查看学院专业",
  "users.view": "查看用户数据",
  "geo.view": "查看地域数据",
  "tracking.view": "查看渠道数据",
  "team.view": "查看团队权限",
};

export default async function TeamPage() {
  const gate = await loadAdminSection("team");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const report = await getTeamReport();
  const active = report.members.filter(
    (member) => member.status === "active",
  ).length;
  const bound = report.members.filter((member) => member.userId).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="TEAM & ACCESS"
        title="团队与权限"
        description="用角色划分数据边界；后台链接可以分享，但只有被授权邮箱能够进入。"
      />
      <section className="observatory-metrics three">
        <AdminMetric
          icon={UsersRound}
          label="团队成员"
          note={`${active} 人拥有访问权限`}
          value={formatNumber(report.members.length)}
        />
        <AdminMetric
          icon={UserRoundCog}
          label="已绑定账户"
          note="使用授权邮箱登录"
          value={formatNumber(bound)}
        />
        <AdminMetric
          icon={KeyRound}
          label="权限角色"
          note="所有者之外五种分工"
          value="6"
        />
      </section>

      <section className="observatory-grid observatory-half-grid team-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>成员管理</span>
              <h2>访问名单</h2>
            </div>
          </header>
          <TeamManager members={report.members} />
        </article>

        <article className="observatory-panel">
          <header>
            <div>
              <span>最小权限原则</span>
              <h2>角色矩阵</h2>
            </div>
            <ShieldCheck aria-hidden="true" size={18} />
          </header>
          <div className="permission-matrix">
            <div className="permission-head">
              <span>角色</span>
              {sections.map((section) => (
                <span key={section.key}>{section.label}</span>
              ))}
            </div>
            {roles.map((role) => (
              <div key={role}>
                <strong>{adminRoleLabel(role)}</strong>
                {sections.map((section) => (
                  <span
                    className={
                      canAccessAdminSection(role, section.key)
                        ? "allowed"
                        : "denied"
                    }
                    key={section.key}
                  >
                    {canAccessAdminSection(role, section.key) ? "●" : "—"}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="observatory-panel">
        <header>
          <div>
            <span>最近 40 条</span>
            <h2>权限与访问审计</h2>
          </div>
        </header>
        <div className="audit-list">
          {report.audits.map((audit) => (
            <div key={audit.id}>
              <span>{audit.adminEmail.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>
                  {actionLabels[audit.action] ?? audit.action}
                </strong>
                <small>{audit.adminEmail}</small>
              </div>
              <code>{audit.resourceType || "admin"}</code>
              <time>{formatDateTime(audit.createdAt)}</time>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
