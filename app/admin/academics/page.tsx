import {
  Award,
  BookOpenCheck,
  Building2,
  GraduationCap,
  LibraryBig,
  Radar,
  Route,
  UsersRound,
  FilePenLine,
} from "lucide-react";
import { AdminDenied } from "@/components/admin/AdminStates";
import { InteractiveBar } from "@/components/admin/InteractiveBar";
import {
  AdminMetric,
  AdminPageHeader,
  EmptyState,
  formatNumber,
  formatPercent,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getAcademicsReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

export default async function AcademicsPage() {
  const gate = await loadAdminSection("academics");
  if (!gate.allowed) {
    return (
      <AdminDenied
        email={gate.access.email}
        section={gate.access.status === "allowed"}
      />
    );
  }
  const report = await getAcademicsReport();
  const maxSchool = Math.max(
    1,
    ...report.schools.map((school) => school.enrolled),
  );
  const maxPathFunnel = Math.max(
    1,
    ...report.answerPaths.funnel.map((item) => item.value),
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="ACADEMIC OPERATIONS"
        title="学院与专业"
        description="从完整学科版图进入，观察学生真正选择、开始并完成了哪些学习。"
      />
      <section className="observatory-metrics six">
        <AdminMetric
          icon={Building2}
          label="学院"
          note="综合大学学科架构"
          value={formatNumber(report.metrics.schools)}
        />
        <AdminMetric
          icon={GraduationCap}
          label="专业"
          note="完整培养方案"
          value={formatNumber(report.metrics.programs)}
        />
        <AdminMetric
          icon={LibraryBig}
          label="课程"
          note="含通识、基础与核心"
          value={formatNumber(report.metrics.courses)}
        />
        <AdminMetric
          icon={UsersRound}
          label="已选专业"
          note="去重学生人数"
          value={formatNumber(report.metrics.enrolled)}
        />
        <AdminMetric
          icon={BookOpenCheck}
          label="进入学习"
          note="近 180 天"
          value={formatNumber(report.metrics.activeLearners)}
        />
        <AdminMetric
          icon={Award}
          label="获得学分"
          note="通过课程考试"
          value={formatNumber(report.metrics.creditsEarned)}
        />
      </section>

      <section className="observatory-grid observatory-half-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>答案路径 · 全周期</span>
              <h2>从开始到现实结果</h2>
            </div>
          </header>
          <div className="funnel-list large">
            {report.answerPaths.funnel.map((item, index) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <InteractiveBar
                  label={`答案路径 · ${item.label}`}
                  orientation="horizontal"
                  percent={Math.max(4, item.value / maxPathFunnel * 100)}
                  value={item.value}
                />
                <strong>{formatNumber(item.value)}</strong>
                <small>
                  {index === 0
                    ? "基线"
                    : formatPercent(
                        report.answerPaths.funnel[index - 1].value
                          ? Math.round(
                              item.value /
                                report.answerPaths.funnel[index - 1].value *
                                100,
                            )
                          : null,
                      )}
                </small>
              </div>
            ))}
          </div>
        </article>
        <article className="observatory-panel">
          <header>
            <div>
              <span>结果质量</span>
              <h2>证据、修订与回访</h2>
            </div>
          </header>
          <div className="observatory-metrics four embedded">
            <AdminMetric
              icon={Radar}
              label="现实证据"
              note="带来源的提交"
              value={formatNumber(report.answerPaths.evidenceCount)}
            />
            <AdminMetric
              icon={FilePenLine}
              label="产物版本"
              note={`${report.answerPaths.revisions} 个修订版本`}
              value={formatNumber(report.answerPaths.artifacts)}
            />
            <AdminMetric
              icon={Route}
              label="要求修订"
              note={`${report.answerPaths.reviews} 次 Agent 审阅`}
              value={formatNumber(report.answerPaths.revisionRequired)}
            />
            <AdminMetric
              icon={Award}
              label="现实结果"
              note="完成结果回访"
              value={formatNumber(report.answerPaths.completed)}
            />
          </div>
        </article>
      </section>

      <section className="observatory-panel">
        <header>
          <div>
            <span>旗舰路径层级</span>
            <h2>六条路径的行动与结果</h2>
          </div>
        </header>
        <div className="user-table-wrap">
          <table>
            <thead>
              <tr>
                <th>答案路径</th>
                <th>目标能力</th>
                <th>开始</th>
                <th>基线</th>
                <th>证据</th>
                <th>作品</th>
                <th>修订</th>
                <th>审阅</th>
                <th>现实结果</th>
              </tr>
            </thead>
            <tbody>
              {report.answerPaths.paths.map((path) => (
                <tr key={path.slug}>
                  <td>
                    <strong>{path.title}</strong>
                    <small>{path.slug}</small>
                  </td>
                  <td>{path.capability}</td>
                  <td>{path.started}</td>
                  <td>{path.baseline}</td>
                  <td>{path.evidence}</td>
                  <td>{path.artifacts}</td>
                  <td>{path.revisions}</td>
                  <td>{path.reviews}</td>
                  <td>{path.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="observatory-grid observatory-half-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>学院层级</span>
              <h2>报名与学习分布</h2>
            </div>
          </header>
          <div className="school-activity-list">
            {report.schools.map((school) => (
              <div key={school.schoolSlug}>
                <div>
                  <strong>{school.school}</strong>
                  <small>
                    {school.discipline} · {school.programs} 个专业 ·{" "}
                    {school.courses} 门课程
                  </small>
                </div>
                <div className="school-bar">
                  <InteractiveBar
                    label={`${school.school} · 报名`}
                    orientation="horizontal"
                    percent={Math.max(2, school.enrolled / maxSchool * 100)}
                    value={school.enrolled}
                  />
                </div>
                <span>{school.enrolled} 报名</span>
                <em>{school.learners} 学习</em>
              </div>
            ))}
          </div>
        </article>

        <article className="observatory-panel">
          <header>
            <div>
              <span>专业层级</span>
              <h2>最受关注的培养方向</h2>
            </div>
          </header>
          <div className="academic-program-list">
            {report.programs.slice(0, 12).map((program, index) => (
              <div key={program.programSlug}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>
                  <strong>{program.program}</strong>
                  <small>
                    {program.school} · {program.credits} 学分 ·{" "}
                    {program.courses} 门课
                  </small>
                </span>
                <dl>
                  <div><dt>报名</dt><dd>{program.enrolled}</dd></div>
                  <div><dt>开始</dt><dd>{program.started}</dd></div>
                  <div><dt>通过学生</dt><dd>{program.completed}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="observatory-panel">
        <header>
          <div>
            <span>课程层级</span>
            <h2>课程参与与考试表现</h2>
          </div>
        </header>
        {report.courses.length ? (
          <div className="user-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>课程</th>
                  <th>学院 / 专业</th>
                  <th>学分</th>
                  <th>加入计划</th>
                  <th>开始学习</th>
                  <th>通过考试</th>
                  <th>平均分</th>
                </tr>
              </thead>
              <tbody>
                {report.courses.map((course) => (
                  <tr key={course.courseSlug}>
                    <td>
                      <strong>{course.course}</strong>
                      <small>{course.courseSlug}</small>
                    </td>
                    <td>{course.school} · {course.program}</td>
                    <td>{course.credits}</td>
                    <td>{course.planned}</td>
                    <td>{course.learners}</td>
                    <td>{course.completed}</td>
                    <td>{course.averageScore ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>学生加入课程后，这里会显示参与与考试数据。</EmptyState>
        )}
      </section>
    </>
  );
}
