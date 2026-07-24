import {
  Award,
  BookOpenCheck,
  Building2,
  GraduationCap,
  LibraryBig,
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
                  <i
                    style={{
                      width: `${Math.max(
                        2,
                        school.enrolled / maxSchool * 100,
                      )}%`,
                    }}
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
                  <div><dt>完成课</dt><dd>{program.completed}</dd></div>
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
