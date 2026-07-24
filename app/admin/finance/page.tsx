import {
  BadgePercent,
  CircleDollarSign,
  Coins,
  RefreshCcw,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { AdminDenied } from "@/components/admin/AdminStates";
import { InteractiveBar } from "@/components/admin/InteractiveBar";
import { InteractiveChartDay } from "@/components/admin/InteractiveChartDay";
import {
  AdminMetric,
  AdminPageHeader,
  EmptyState,
  formatNumber,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getRevenueReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

function money(fen: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(fen / 100);
}

export default async function FinancePage() {
  const gate = await loadAdminSection("finance");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const report = await getRevenueReport();
  const maxMonth = Math.max(
    1,
    ...report.months.flatMap((row) => [
      row.productionFen,
      row.testFen,
    ]),
  );
  const maxLtv = Math.max(
    1,
    ...report.ltvCurve.map((row) => row.ltvFen),
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="REVENUE & LIFETIME VALUE"
        title="付费与 LTV"
        description="真实收入与测试交易完全分离；LTV 只使用生产订单，绝不把测试充值当成收入。"
      />

      <section className="finance-integrity-note">
        <strong>当前真实支付尚未接入</strong>
        <span>
          因此生产收入与生产 LTV 应为 ¥0。下方沙盒区仅用于验证选课与支付流程。
        </span>
      </section>

      <section className="observatory-metrics six">
        <AdminMetric
          icon={CircleDollarSign}
          label="生产净收入"
          note={`退款 ${money(report.production.refundedFen)}`}
          value={money(report.production.netRevenueFen)}
        />
        <AdminMetric
          icon={UsersRound}
          label="生产付费用户"
          note={`付费率 ${report.production.conversionRate}%`}
          value={formatNumber(report.production.payerCount)}
        />
        <AdminMetric
          icon={TrendingUp}
          label="观测 LTV"
          note="累计净收入 ÷ 正式用户"
          value={money(report.production.arpuFen)}
        />
        <AdminMetric
          icon={Coins}
          label="ARPPU"
          note="累计净收入 ÷ 付费用户"
          value={money(report.production.arppuFen)}
        />
        <AdminMetric
          icon={RefreshCcw}
          label="复购率"
          note="至少两笔生产订单"
          value={`${report.production.repeatRate}%`}
        />
        <AdminMetric
          icon={BadgePercent}
          label="收入减模型成本"
          note="尚未扣服务器与通道费"
          value={money(report.production.contributionFen)}
        />
      </section>

      <section className="observatory-grid observatory-primary-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>最近 12 个月</span>
              <h2>月度订单金额</h2>
            </div>
            <div className="chart-legend">
              <span><i className="production" />生产</span>
              <span><i className="test" />测试</span>
            </div>
          </header>
          <div className="finance-month-chart" aria-label="最近十二个月订单金额">
            {report.months.map((row) => (
              <InteractiveChartDay
                barsClassName="finance-month-bars"
                dateLabel={row.month}
                displayedDate={row.month.slice(5)}
                key={row.month}
                rootClassName="finance-month"
                series={[
                  {
                    className: "production",
                    format: "currency",
                    label: "生产净收入",
                    percent: Math.max(
                      2,
                      row.productionFen / maxMonth * 100,
                    ),
                    value: row.productionFen / 100,
                  },
                  {
                    className: "test",
                    format: "currency",
                    label: "测试交易额",
                    percent: Math.max(
                      2,
                      row.testFen / maxMonth * 100,
                    ),
                    value: row.testFen / 100,
                  },
                ]}
              />
            ))}
          </div>
        </article>

        <article className="observatory-panel">
          <header>
            <div>
              <span>注册后月龄</span>
              <h2>观测 LTV 曲线</h2>
            </div>
          </header>
          <div className="ltv-curve">
            {report.ltvCurve.map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                <InteractiveBar
                  format="currency"
                  label={`${row.label} · ${row.users} 名成熟用户`}
                  orientation="horizontal"
                  percent={Math.max(3, row.ltvFen / maxLtv * 100)}
                  value={row.ltvFen / 100}
                />
                <strong>{money(row.ltvFen)}</strong>
                <small>{row.users} 人</small>
              </div>
            ))}
          </div>
          <p className="observatory-empty-note">
            M0 至 M6 是已发生收入的累计均值，不包含任何未来收入预测。
          </p>
        </article>
      </section>

      <section className="observatory-grid observatory-half-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>最近 8 个注册月</span>
              <h2>Cohort 付费表现</h2>
            </div>
          </header>
          <div className="user-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>注册月</th>
                  <th>注册</th>
                  <th>付费</th>
                  <th>转化率</th>
                  <th>净收入</th>
                  <th>观测 LTV</th>
                </tr>
              </thead>
              <tbody>
                {report.cohorts.map((row) => (
                  <tr key={row.cohort}>
                    <td><strong>{row.cohort}</strong></td>
                    <td>{row.registered}</td>
                    <td>{row.payers}</td>
                    <td>{row.conversionRate}%</td>
                    <td>{money(row.netRevenueFen)}</td>
                    <td>{money(row.observedLtvFen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="observatory-panel sandbox-panel">
          <header>
            <div>
              <span>TEST PAYMENT SANDBOX</span>
              <h2>测试交易，不计收入</h2>
            </div>
          </header>
          <dl className="sandbox-metrics">
            <div><dt>测试交易额</dt><dd>{money(report.simulation.netRevenueFen)}</dd></div>
            <div><dt>测试付费账户</dt><dd>{report.simulation.payerCount}</dd></div>
            <div><dt>测试 ARPPU</dt><dd>{money(report.simulation.arppuFen)}</dd></div>
            <div><dt>测试储值</dt><dd>{money(report.simulation.testWalletTopupFen)}</dd></div>
          </dl>
          <p>
            这些数值只用于验证订单、解锁和储值流程，不进入生产收入、ARPU、LTV 或贡献利润。
          </p>
        </article>
      </section>

      <section className="observatory-panel">
        <header>
          <div>
            <span>课程层级</span>
            <h2>课程订单贡献</h2>
          </div>
        </header>
        {report.courses.length ? (
          <div className="user-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>课程</th>
                  <th>生产收入</th>
                  <th>生产付费用户</th>
                  <th>测试交易额</th>
                  <th>测试账户</th>
                </tr>
              </thead>
              <tbody>
                {report.courses.map((course) => (
                  <tr key={course.nodeSlug}>
                    <td>
                      <strong>{course.title}</strong>
                      <small>{course.nodeSlug}</small>
                    </td>
                    <td>{money(course.productionFen)}</td>
                    <td>{course.productionPayers}</td>
                    <td>{money(course.testFen)}</td>
                    <td>{course.testPayers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>产生课程订单后，这里会显示各课程的交易贡献。</EmptyState>
        )}
      </section>
    </>
  );
}
