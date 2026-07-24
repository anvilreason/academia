import {
  Activity,
  BookOpenCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AdminDenied } from "@/components/admin/AdminStates";
import {
  AdminMetric,
  AdminPageHeader,
  EmptyState,
  formatNumber,
  formatPercent,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getGrowthReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

function changeLabel(change: number | null) {
  if (change === null) return "暂无上期基线";
  if (change === 0) return "与上周持平";
  return `较上周${change > 0 ? "增长" : "下降"} ${Math.abs(change)}%`;
}

export default async function GrowthPage() {
  const gate = await loadAdminSection("growth");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const report = await getGrowthReport();
  const maxDaily = Math.max(
    1,
    ...report.daily.flatMap((day) => [
      day.visitors,
      day.registrations,
      day.active,
    ]),
  );
  const maxFunnel = Math.max(
    1,
    ...report.funnel.map((item) => item.value),
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="GROWTH & RETENTION"
        title="增长与留存"
        description="区分流量、注册和真实学习，观察用户是否愿意回来继续思考。"
      />
      <section className="observatory-metrics four">
        <AdminMetric
          icon={UsersRound}
          label="7 日访问"
          note={changeLabel(report.metrics.visitorsChange)}
          value={formatNumber(report.metrics.visitors7d)}
        />
        <AdminMetric
          icon={UserPlus}
          label="7 日新增"
          note={changeLabel(report.metrics.registrationsChange)}
          value={formatNumber(report.metrics.registrations7d)}
        />
        <AdminMetric
          icon={Activity}
          label="7 日活跃"
          note={changeLabel(report.metrics.activeChange)}
          value={formatNumber(report.metrics.active7d)}
        />
        <AdminMetric
          icon={BookOpenCheck}
          label="7 日学习"
          note={changeLabel(report.metrics.learnersChange)}
          value={formatNumber(report.metrics.learners7d)}
        />
      </section>

      <section className="observatory-grid observatory-primary-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>最近 30 天</span>
              <h2>访问、新增与活跃</h2>
            </div>
            <div className="chart-legend">
              <span><i className="visitor" />访问</span>
              <span><i className="registration" />新增</span>
              <span><i className="active" />活跃</span>
            </div>
          </header>
          <div className="growth-chart" aria-label="最近三十天增长趋势">
            {report.daily.map((day, index) => (
              <div className="growth-day" key={day.dateKey}>
                <div>
                  <i
                    className="visitor"
                    style={{ height: `${Math.max(2, day.visitors / maxDaily * 100)}%` }}
                    title={`访问 ${day.visitors}`}
                  />
                  <i
                    className="registration"
                    style={{ height: `${Math.max(2, day.registrations / maxDaily * 100)}%` }}
                    title={`新增 ${day.registrations}`}
                  />
                  <i
                    className="active"
                    style={{ height: `${Math.max(2, day.active / maxDaily * 100)}%` }}
                    title={`活跃 ${day.active}`}
                  />
                </div>
                {index % 5 === 0 && <small>{day.dateKey.slice(5)}</small>}
              </div>
            ))}
          </div>
        </article>

        <article className="observatory-panel">
          <header>
            <div>
              <span>最近 30 天</span>
              <h2>核心转化</h2>
            </div>
          </header>
          <div className="funnel-list large">
            {report.funnel.map((item, index) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i
                  style={{
                    width: `${Math.max(4, item.value / maxFunnel * 100)}%`,
                  }}
                />
                <strong>{formatNumber(item.value)}</strong>
                <small>
                  {index === 0
                    ? "基线"
                    : formatPercent(
                        report.funnel[index - 1].value
                          ? Math.round(
                              item.value /
                                report.funnel[index - 1].value *
                                100,
                            )
                          : null,
                      )}
                </small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="observatory-grid observatory-half-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>注册周 Cohort</span>
              <h2>学习留存</h2>
            </div>
          </header>
          <div className="user-table-wrap retention-table">
            <table>
              <thead>
                <tr>
                  <th>注册周</th>
                  <th>人数</th>
                  <th>D1</th>
                  <th>D7</th>
                  <th>D30</th>
                </tr>
              </thead>
              <tbody>
                {report.cohorts.map((cohort) => (
                  <tr key={cohort.label}>
                    <td>{cohort.label}</td>
                    <td>{cohort.users}</td>
                    {[cohort.day1, cohort.day7, cohort.day30].map(
                      (value, index) => (
                        <td key={index}>
                          <span
                            className={`retention-cell ${
                              value === null
                                ? "pending"
                                : value >= 30
                                  ? "strong"
                                  : ""
                            }`}
                          >
                            {formatPercent(value)}
                          </span>
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="observatory-empty-note">
            留存定义为注册后对应时间窗内再次发生学习、考试或账户行为。
          </p>
        </article>

        <article className="observatory-panel">
          <header>
            <div>
              <span>第一触点</span>
              <h2>来源质量</h2>
            </div>
          </header>
          {report.sources.length ? (
            <div className="source-list">
              <div className="source-list-head">
                <span>来源</span>
                <span>访问</span>
                <span>注册</span>
                <span>学习</span>
                <span>注册率</span>
              </div>
              {report.sources.map((source) => (
                <div key={source.source}>
                  <strong>{source.source}</strong>
                  <span>{source.visitors}</span>
                  <span>{source.signups}</span>
                  <span>{source.learners}</span>
                  <span>{source.signupRate}%</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>新渠道数据积累后将在这里比较来源质量。</EmptyState>
          )}
        </article>
      </section>
    </>
  );
}
