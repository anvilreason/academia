import {
  Globe2,
  Map,
  MapPin,
  MonitorSmartphone,
  UsersRound,
} from "lucide-react";
import { AdminDenied } from "@/components/admin/AdminStates";
import {
  AdminMetric,
  AdminPageHeader,
  EmptyState,
  formatNumber,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getGeoReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

const deviceLabels: Record<string, string> = {
  desktop: "桌面设备",
  mobile: "手机",
  tablet: "平板",
};

export default async function GeoPage() {
  const gate = await loadAdminSection("geo");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const report = await getGeoReport();
  const maxDevice = Math.max(
    1,
    ...report.devices.map((item) => item.users),
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="GEOGRAPHIC INSIGHT"
        title="地域与访问环境"
        description="以城市级聚合观察 Academia 正在哪里被发现，不保留任何明文 IP。"
      />
      <section className="observatory-metrics four">
        <AdminMetric
          icon={Globe2}
          label="国家与地区"
          note="近 90 天识别"
          value={formatNumber(report.metrics.countries)}
        />
        <AdminMetric
          icon={Map}
          label="省份 / 州"
          note="城市级边缘推断"
          value={formatNumber(report.metrics.regions)}
        />
        <AdminMetric
          icon={MapPin}
          label="城市"
          note="仅聚合展示"
          value={formatNumber(report.metrics.cities)}
        />
        <AdminMetric
          icon={UsersRound}
          label="已识别访问者"
          note="匿名与注册用户去重"
          value={formatNumber(report.metrics.identifiedVisitors)}
        />
      </section>

      <section className="observatory-grid observatory-geo-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>近 90 天</span>
              <h2>城市表现</h2>
            </div>
          </header>
          {report.cities.length ? (
            <div className="user-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>城市</th>
                    <th>区域</th>
                    <th>访问者</th>
                    <th>注册</th>
                    <th>学习</th>
                    <th>注册率</th>
                  </tr>
                </thead>
                <tbody>
                  {report.cities.map((city) => (
                    <tr key={`${city.country}-${city.region}-${city.city}`}>
                      <td><strong>{city.city}</strong></td>
                      <td>{city.region} · {city.country}</td>
                      <td>{city.visitors}</td>
                      <td>{city.registrations}</td>
                      <td>{city.learners}</td>
                      <td>{city.signupRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>真实访问产生后将显示城市分布。</EmptyState>
          )}
        </article>

        <div className="observatory-stack">
          <article className="observatory-panel">
            <header>
              <div>
                <span>设备类别</span>
                <h2>访问环境</h2>
              </div>
              <MonitorSmartphone aria-hidden="true" size={18} />
            </header>
            <div className="distribution-list">
              {report.devices.map((device) => (
                <div key={device.label}>
                  <span>{deviceLabels[device.label] ?? device.label}</span>
                  <i>
                    <b
                      style={{
                        width: `${device.users / maxDevice * 100}%`,
                      }}
                    />
                  </i>
                  <strong>{device.users}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="observatory-panel">
            <header>
              <div>
                <span>外部引荐</span>
                <h2>访问来源站点</h2>
              </div>
            </header>
            {report.referrers.length ? (
              <div className="page-rank-list">
                {report.referrers.map((referrer) => (
                  <div key={referrer.host}>
                    <code>{referrer.host}</code>
                    <strong>{referrer.users} 人</strong>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>当前访问以直接访问为主。</EmptyState>
            )}
          </article>
        </div>
      </section>

      <p className="privacy-callout">
        地域来源于 Cloudflare 网络边缘提供的城市级推断。Academia
        不保存明文 IP、经纬度、邮编或设备指纹，也不对单个用户绘制精确位置。
      </p>
    </>
  );
}
