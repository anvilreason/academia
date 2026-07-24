import { BookMarked, CheckCircle2, FlaskConical, TimerReset } from "lucide-react";
import { AdminDenied } from "@/components/admin/AdminStates";
import {
  AdminMetric,
  AdminPageHeader,
  formatNumber,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { metricDefinitions } from "@/lib/analytics/metric-definitions";

export const dynamic = "force-dynamic";

export default async function DefinitionsPage() {
  const gate = await loadAdminSection("definitions");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const reliable = metricDefinitions.filter(
    (item) => item.status === "可靠",
  ).length;
  const accumulating = metricDefinitions.filter(
    (item) => item.status === "需积累",
  ).length;
  const sandbox = metricDefinitions.filter(
    (item) => item.status === "测试环境",
  ).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="METRIC DICTIONARY"
        title="数据口径"
        description="每个数字都说明计算方法、数据表、时间窗与局限；团队使用同一套定义作出判断。"
      />
      <section className="observatory-metrics four">
        <AdminMetric
          icon={BookMarked}
          label="指标定义"
          note="覆盖账户、学习、增长与财务"
          value={formatNumber(metricDefinitions.length)}
        />
        <AdminMetric
          icon={CheckCircle2}
          label="可靠口径"
          note="可直接用于日常判断"
          value={formatNumber(reliable)}
        />
        <AdminMetric
          icon={TimerReset}
          label="需要积累"
          note="口径正确，样本仍在形成"
          value={formatNumber(accumulating)}
        />
        <AdminMetric
          icon={FlaskConical}
          label="测试环境"
          note="不得视为真实商业结果"
          value={formatNumber(sandbox)}
        />
      </section>

      <section className="definition-audit-note">
        <strong>本轮已修正的统计问题</strong>
        <ul>
          <li>真实支付与测试支付彻底分开，储值不再被误认为收入。</li>
          <li>漏斗改为同一身份逐层取交集，后段不会高于前段。</li>
          <li>课程完成与学分按“用户 × 课程”去重，重修不重复累计。</li>
          <li>来源采用单一第一触点归因，设备与地域访问只基于页面浏览。</li>
          <li>重复确认测试订单不再重复写入支付成功事件。</li>
        </ul>
      </section>

      <section className="observatory-panel">
        <header>
          <div>
            <span>统一定义</span>
            <h2>指标字典</h2>
          </div>
        </header>
        <div className="user-table-wrap definition-table">
          <table>
            <thead>
              <tr>
                <th>指标</th>
                <th>定义</th>
                <th>数据源</th>
                <th>时间窗</th>
                <th>状态</th>
                <th>使用边界</th>
              </tr>
            </thead>
            <tbody>
              {metricDefinitions.map((metric) => (
                <tr key={metric.id}>
                  <td>
                    <strong>{metric.label}</strong>
                    <small>{metric.section}</small>
                  </td>
                  <td>{metric.definition}</td>
                  <td><code>{metric.source}</code></td>
                  <td>{metric.window}</td>
                  <td>
                    <span
                      className={`definition-status status-${metric.status}`}
                    >
                      {metric.status}
                    </span>
                  </td>
                  <td>{metric.caveat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
