import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  BrainCircuit,
  GraduationCap,
  MapPin,
  ReceiptText,
} from "lucide-react";
import { AdminDenied } from "@/components/admin/AdminStates";
import {
  AdminMetric,
  AdminPageHeader,
  EmptyState,
  formatDateTime,
} from "@/components/admin/AdminPrimitives";
import { loadAdminSection } from "@/lib/analytics/admin-page";
import { getUserReport } from "@/lib/analytics/reports";

export const dynamic = "force-dynamic";

const eventLabels: Record<string, string> = {
  page_view: "浏览页面",
  signup_completed: "建立学籍",
  login_succeeded: "登录",
  program_enrolled: "选择专业",
  course_enrolled: "加入课程",
  course_started: "开始课程",
  learning_message_sent: "课堂对话",
  exam_submitted: "提交考试",
  course_completed: "完成课程",
  agent_message_sent: "总 Agent 对话",
  payment_succeeded: "完成选课",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
  const { id } = await params;
  const report = await getUserReport(id);
  if (!report) notFound();

  return (
    <>
      <Link className="admin-back-link" href="/admin/users">
        <ArrowLeft aria-hidden="true" size={14} />
        返回用户列表
      </Link>
      <AdminPageHeader
        eyebrow="STUDENT PROFILE"
        title={report.user.name || "未设置称呼"}
        description={`${report.user.email} · ${
          report.user.verified ? "邮箱已验证" : "邮箱待验证"
        } · ${report.user.status === "active" ? "账户正常" : report.user.status}`}
      />
      <section className="observatory-metrics four">
        <AdminMetric
          icon={GraduationCap}
          label="所选专业"
          note="当前学籍记录"
          value={String(report.programs.length)}
        />
        <AdminMetric
          icon={BookOpenCheck}
          label="课程计划"
          note="含学分互认"
          value={String(report.courses.length)}
        />
        <AdminMetric
          icon={BrainCircuit}
          label="长期记忆"
          note="仅显示条数，不展示正文"
          value={String(report.user.memories)}
        />
        <AdminMetric
          icon={ReceiptText}
          label="订单"
          note="测试与正式订单"
          value={String(report.orders.length)}
        />
      </section>

      <section className="observatory-grid observatory-user-profile-grid">
        <article className="observatory-panel profile-facts">
          <header>
            <div>
              <span>账户信息</span>
              <h2>学籍概览</h2>
            </div>
          </header>
          <dl>
            <div><dt>建立学籍</dt><dd>{formatDateTime(report.user.createdAt)}</dd></div>
            <div><dt>最后活跃</dt><dd>{formatDateTime(report.user.lastActiveAt)}</dd></div>
            <div><dt>城市</dt><dd><MapPin size={13} />{report.user.city || "未知"}</dd></div>
            <div><dt>最初来源</dt><dd>{report.user.source}</dd></div>
          </dl>
        </article>
        <article className="observatory-panel">
          <header>
            <div>
              <span>专业</span>
              <h2>培养方向</h2>
            </div>
          </header>
          {report.programs.length ? (
            <div className="simple-record-list">
              {report.programs.map((program) => (
                <div key={program.id}>
                  <strong>{program.name}</strong>
                  <span>{program.status === "active" ? "在读" : program.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>尚未选择专业。</EmptyState>
          )}
        </article>
        <article className="observatory-panel">
          <header>
            <div>
              <span>考试</span>
              <h2>最近成绩</h2>
            </div>
          </header>
          {report.attempts.length ? (
            <div className="simple-record-list">
              {report.attempts.slice(0, 8).map((attempt) => (
                <div key={attempt.id}>
                  <span>
                    <strong>{attempt.title}</strong>
                    <small>第 {attempt.attemptNumber} 次作答</small>
                  </span>
                  <em>{attempt.score} 分 · GPA {(attempt.gradePointHundredths / 100).toFixed(1)}</em>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>尚无考试记录。</EmptyState>
          )}
        </article>
      </section>

      <section className="observatory-grid observatory-half-grid">
        <article className="observatory-panel">
          <header>
            <div>
              <span>课程</span>
              <h2>学习进度</h2>
            </div>
          </header>
          {report.sessions.length ? (
            <div className="simple-record-list">
              {report.sessions.slice(0, 12).map((session) => (
                <div key={session.id}>
                  <span>
                    <strong>{session.title}</strong>
                    <small>{formatDateTime(session.updatedAt)}</small>
                  </span>
                  <em>{session.progress}% · {session.status}</em>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>尚未开始课程。</EmptyState>
          )}
        </article>
        <article className="observatory-panel">
          <header>
            <div>
              <span>最近行为</span>
              <h2>活动时间线</h2>
            </div>
          </header>
          {report.events.length ? (
            <div className="event-timeline">
              {report.events.slice(0, 14).map((event, index) => (
                <div key={`${event.occurredAt}-${index}`}>
                  <i />
                  <span>
                    <strong>{eventLabels[event.eventName] ?? event.eventName}</strong>
                    <small>{event.path || event.city || "Academia"}</small>
                  </span>
                  <time>{formatDateTime(event.occurredAt)}</time>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>尚无可展示的活动记录。</EmptyState>
          )}
        </article>
      </section>
    </>
  );
}
