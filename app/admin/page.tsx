import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  CircleUserRound,
  Clock3,
  GraduationCap,
  MapPinned,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { getAdminAccess } from "@/lib/analytics/admin";
import { getAdminSummary } from "@/lib/analytics/summary";

export const dynamic = "force-dynamic";

function number(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function dateTime(value: string | null) {
  if (!value) return "尚无活动";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof UsersRound;
}) {
  return (
    <article className="observatory-metric">
      <div>
        <span>{label}</span>
        <Icon aria-hidden="true" size={16} />
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

export default async function AdminPage() {
  const access = await getAdminAccess();
  if (access.status === "signed_out") {
    redirect("/login?continue=%2Fadmin");
  }
  if (access.status === "forbidden") {
    return (
      <section className="observatory-access-state">
        <ShieldAlert aria-hidden="true" size={28} />
        <p className="observatory-kicker">ACCESS CONTROL</p>
        <h1>这个账户尚未加入校务观测台</h1>
        <p>
          当前登录账户为 {access.email}。请由所有者在团队权限中发出邀请。
        </p>
        <Link href="/">返回 Academia</Link>
      </section>
    );
  }

  const summary = await getAdminSummary();
  const maxTrend = Math.max(
    1,
    ...summary.trend.flatMap((item) => [
      item.registrations,
      item.active,
    ]),
  );
  const maxFunnel = Math.max(
    1,
    ...summary.funnel.map((item) => item.value),
  );

  return (
    <>
      <header className="observatory-header">
        <div>
          <p className="observatory-kicker">ACADEMIA OBSERVATORY · V0.10</p>
          <h1>校务总览</h1>
          <p>从访问到学习完成，观察真实发生的事情。</p>
        </div>
        <div className="observatory-owner">
          <span>{access.name?.slice(0, 1) || "A"}</span>
          <div>
            <strong>{access.name || "Observatory Owner"}</strong>
            <small>{access.email}</small>
          </div>
        </div>
      </header>

      <section className="observatory-metrics">
        <Metric
          icon={UsersRound}
          label="注册学籍"
          note={`今日新增 ${number(summary.metrics.newToday)}`}
          value={number(summary.metrics.totalUsers)}
        />
        <Metric
          icon={Activity}
          label="7 日活跃"
          note="发生过学习或账户行为"
          value={number(summary.metrics.active7d)}
        />
        <Metric
          icon={BookOpenCheck}
          label="本周学习"
          note="进入过对话课堂"
          value={number(summary.metrics.learningUsers7d)}
        />
        <Metric
          icon={GraduationCap}
          label="完成课程"
          note="通过考试并获得学分"
          value={number(summary.metrics.completedCourses)}
        />
        <Metric
          icon={BrainCircuit}
          label="今日模型成本"
          note="按已完成调用结算"
          value={`¥${(summary.metrics.costFenToday / 100).toFixed(2)}`}
        />
      </section>

      <section className="observatory-grid observatory-primary-grid">
        <article className="observatory-panel trend-panel">
          <header>
            <div>
              <span>最近 14 天</span>
              <h2>新增与活跃</h2>
            </div>
            <div className="chart-legend">
              <span><i className="registration" />新增</span>
              <span><i className="active" />活跃</span>
            </div>
          </header>
          <div className="trend-chart" aria-label="最近十四天新增与活跃趋势">
            {summary.trend.map((item) => (
              <div className="trend-day" key={item.dateKey}>
                <div className="trend-bars">
                  <i
                    className="registration"
                    style={{
                      height: `${Math.max(
                        3,
                        (item.registrations / maxTrend) * 100,
                      )}%`,
                    }}
                    title={`新增 ${item.registrations}`}
                  />
                  <i
                    className="active"
                    style={{
                      height: `${Math.max(
                        3,
                        (item.active / maxTrend) * 100,
                      )}%`,
                    }}
                    title={`活跃 ${item.active}`}
                  />
                </div>
                <small>{item.dateKey.slice(5)}</small>
              </div>
            ))}
          </div>
          {!summary.trackingSince && (
            <p className="observatory-empty-note">
              新埋点从本版本开始积累；历史注册和课程数据已纳入总数。
            </p>
          )}
        </article>

        <article className="observatory-panel funnel-panel">
          <header>
            <div>
              <span>最近 30 天</span>
              <h2>学习路径</h2>
            </div>
          </header>
          <div className="funnel-list">
            {summary.funnel.map((item, index) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i
                  style={{
                    width: `${Math.max(
                      4,
                      (item.value / maxFunnel) * 100,
                    )}%`,
                  }}
                />
                <strong>{number(item.value)}</strong>
                {index > 0 && (
                  <small>
                    {summary.funnel[index - 1].value
                      ? `${Math.round(
                          (item.value /
                            summary.funnel[index - 1].value) *
                            100,
                        )}%`
                      : "—"}
                  </small>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="observatory-grid observatory-secondary-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>学科选择</span>
              <h2>专业报名</h2>
            </div>
            <GraduationCap aria-hidden="true" size={18} />
          </header>
          <div className="rank-list">
            {summary.topPrograms.length ? (
              summary.topPrograms.map((program, index) => (
                <div key={program.programSlug}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>
                    <strong>{program.name}</strong>
                    <small>{program.school}</small>
                  </span>
                  <em>{number(program.students)} 人</em>
                </div>
              ))
            ) : (
              <p className="observatory-empty-note">尚无专业报名记录</p>
            )}
          </div>
        </article>

        <article className="observatory-panel">
          <header>
            <div>
              <span>城市级识别</span>
              <h2>活跃地域</h2>
            </div>
            <MapPinned aria-hidden="true" size={18} />
          </header>
          <div className="rank-list">
            {summary.topCities.length ? (
              summary.topCities.map((location, index) => (
                <div
                  key={`${location.country}-${location.region}-${location.city}`}
                >
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>
                    <strong>{location.city}</strong>
                    <small>
                      {[location.region, location.country]
                        .filter(Boolean)
                        .join(" · ") || "城市级 IP 推断"}
                    </small>
                  </span>
                  <em>{number(location.users)} 人</em>
                </div>
              ))
            ) : (
              <p className="observatory-empty-note">
                新访问产生后开始显示城市分布
              </p>
            )}
          </div>
        </article>

        <article className="observatory-panel">
          <header>
            <div>
              <span>页面行为</span>
              <h2>访问最多</h2>
            </div>
            <ArrowUpRight aria-hidden="true" size={18} />
          </header>
          <div className="page-rank-list">
            {summary.topPages.length ? (
              summary.topPages.map((page) => (
                <div key={page.path}>
                  <code>{page.path}</code>
                  <strong>{number(page.views)}</strong>
                </div>
              ))
            ) : (
              <p className="observatory-empty-note">
                页面埋点刚刚启用，访问后即可看到排名
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="observatory-panel recent-users-panel">
        <header>
          <div>
            <span>最近建立学籍</span>
            <h2>用户账户</h2>
          </div>
          <CircleUserRound aria-hidden="true" size={18} />
        </header>
        <div className="user-table-wrap">
          <table>
            <thead>
              <tr>
                <th>用户</th>
                <th>注册时间</th>
                <th>最后活跃</th>
                <th>城市</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name || "未设置称呼"}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>{dateTime(user.createdAt)}</td>
                  <td>
                    <span className="activity-time">
                      <Clock3 aria-hidden="true" size={13} />
                      {dateTime(user.lastActiveAt)}
                    </span>
                  </td>
                  <td>{user.city || "未知"}</td>
                  <td>
                    <span className={`status-pill ${user.status}`}>
                      {user.status === "active" ? "正常" : user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!summary.recentUsers.length && (
          <p className="observatory-empty-note">尚无正式用户账户</p>
        )}
      </section>

      <footer className="observatory-data-note">
        城市来自网络边缘的 IP 城市级推断，不保存明文 IP。测试账号默认排除。
        数据生成于 {dateTime(summary.generatedAt)}。
      </footer>
    </>
  );
}
