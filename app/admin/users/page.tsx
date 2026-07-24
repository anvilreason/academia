import Link from "next/link";
import {
  BadgeCheck,
  CircleDollarSign,
  Search,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { AdminDenied } from "@/components/admin/AdminStates";
import {
  AdminMetric,
  AdminPageHeader,
  formatDateTime,
  formatNumber,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getUsersReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const gate = await loadAdminSection("users");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const { q = "" } = await searchParams;
  const report = await getUsersReport(q);

  return (
    <>
      <AdminPageHeader
        eyebrow="STUDENT RECORDS"
        title="用户与学籍"
        description="查看账户状态、学习参与和付费记录；密码摘要永不在后台展示。"
        actions={
          <form className="admin-search" action="/admin/users">
            <Search aria-hidden="true" size={15} />
            <input
              aria-label="搜索用户"
              defaultValue={report.search}
              name="q"
              placeholder="搜索邮箱或称呼"
            />
            <button type="submit">查找</button>
          </form>
        }
      />
      <section className="observatory-metrics four">
        <AdminMetric
          icon={UsersRound}
          label="正式账户"
          note="已排除测试账号"
          value={formatNumber(report.metrics.total)}
        />
        <AdminMetric
          icon={BadgeCheck}
          label="邮箱已验证"
          note="DirectMail 接入后增长"
          value={formatNumber(report.metrics.verified)}
        />
        <AdminMetric
          icon={UserRoundCheck}
          label="30 日活跃"
          note="发生有效产品行为"
          value={formatNumber(report.metrics.active30d)}
        />
        <AdminMetric
          icon={CircleDollarSign}
          label="生产付费用户"
          note="不包含测试订单"
          value={formatNumber(report.metrics.paying)}
        />
      </section>

      <section className="observatory-panel">
        <header>
          <div>
            <span>
              {report.search
                ? `${report.totalMatches} 条搜索结果`
                : "最近注册"}
            </span>
            <h2>账户列表</h2>
          </div>
        </header>
        <div className="user-table-wrap">
          <table>
            <thead>
              <tr>
                <th>用户</th>
                <th>建立学籍</th>
                <th>最后活跃</th>
                <th>城市</th>
                <th>专业</th>
                <th>课程</th>
                <th>完成</th>
                <th>生产净收入</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {report.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name || "未设置称呼"}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>{formatDateTime(user.createdAt)}</td>
                  <td>{formatDateTime(user.lastActiveAt)}</td>
                  <td>{user.city || "未知"}</td>
                  <td>{user.programs}</td>
                  <td>{user.courses}</td>
                  <td>{user.completed}</td>
                  <td>¥{(user.spendFen / 100).toFixed(2)}</td>
                  <td>
                    <Link
                      className="table-action"
                      href={`/admin/users/${user.id}`}
                    >
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!report.users.length && (
          <p className="observatory-empty-note">没有匹配的正式用户。</p>
        )}
      </section>
    </>
  );
}
