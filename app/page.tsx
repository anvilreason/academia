import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CircleDot,
  Compass,
} from "lucide-react";
import {
  answerTopics,
  creationStages,
  flagshipAnswerTopics,
} from "@/lib/content/answer-paths";
import {
  getAllUniversityCourses,
  universitySchools,
  universityStats,
} from "@/lib/content/university";

const selectedQuestions = [
  "is-this-a-false-demand",
  "non-leading-user-interviews",
  "course-to-portfolio",
  "first-prototype-scope",
  "liking-without-paying",
  "continue-pivot-or-stop",
  "first-twenty-users",
  "self-hire-or-agent",
].map((slug) => answerTopics.find((item) => item.slug === slug)!);

const formallyOpenCourses = getAllUniversityCourses().filter(
  ({ course }) => course.availability === "open",
).length;

export default function LandingPage() {
  return (
    <main className="marketing-page v1-landing">
      <div className="preview-notice">
        先行校区 · 功能预览环境，请勿填写敏感信息或真实支付资料
      </div>

      <header className="marketing-header page-width">
        <Link className="wordmark" href="/" aria-label="Academia 首页">
          Academia
        </Link>
        <nav className="marketing-nav" aria-label="主导航">
          <Link href="/answers">答案地图</Link>
          <Link href="/college">学院地图</Link>
          <Link href="/answers#flagship">精选路径</Link>
          <Link href="/login">登录／建立学籍</Link>
        </nav>
      </header>

      <section className="v1-hero">
        <div className="v1-hero-grid page-width">
          <div className="v1-hero-copy">
            <p className="eyebrow">A UNIVERSITY FOR FIRST-TIME CREATORS</p>
            <h1>
              答案不从提问开始，
              <br />
              而从发现真正的问题开始。
            </h1>
            <p>
              Academia 为第一次把想法变成作品、产品与事业的人而建。
              从一个真实问题出发，找到必要的学科，完成必须亲自完成的行动，
              再让现实检验你的判断。
            </p>
            <div className="hero-actions">
              <Link className="button button-signal button-large" href="/answers">
                展开答案地图
                <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
              <Link className="hero-secondary-link" href="/college">
                学院与专业
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>

          <aside className="v1-hero-index" aria-label="创造阶段">
            <span>CREATION INDEX / 01—06</span>
            <ol>
              {creationStages.map((stage) => (
                <li key={stage.slug}>
                  <b>{stage.index}</b>
                  <div>
                    <strong>{stage.name}</strong>
                    <small>{stage.description}</small>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="v1-proof">
        <div className="page-width">
          <div>
            <strong>{answerTopics.length}</strong>
            <span>条核心问题已进入答案地图</span>
          </div>
          <div>
            <strong>{flagshipAnswerTopics.length}</strong>
            <span>条旗舰路径正在编制</span>
          </div>
          <div>
            <strong>{formallyOpenCourses}</strong>
            <span>门课程已正式开放</span>
          </div>
          <div>
            <strong>{universityStats.courses.toLocaleString("zh-CN")}</strong>
            <span>个课程结构与知识节点可供调用</span>
          </div>
        </div>
      </section>

      <section className="v1-question-section page-width">
        <header className="v1-section-heading">
          <div>
            <p className="eyebrow">SELECTED QUESTIONS</p>
            <h2>先找到值得回答的问题。</h2>
          </div>
          <p>
            每个问题都标明一个初步结论、需要交付的产物、预计时间和调用学科。
            尚未完成的路径会如实显示状态。
          </p>
        </header>
        <div className="v1-question-grid">
          {selectedQuestions.map((topic, index) => (
            <Link
              className="v1-question-card"
              href={`/answers/${topic.slug}`}
              key={topic.slug}
            >
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <em>
                  {creationStages.find((stage) => stage.slug === topic.stage)?.name}
                </em>
              </div>
              <h3>{topic.title}</h3>
              <p>{topic.initialConclusion}</p>
              <dl>
                <div>
                  <dt>产物</dt>
                  <dd>{topic.artifact}</dd>
                </div>
                <div>
                  <dt>时间</dt>
                  <dd>{topic.duration}</dd>
                </div>
              </dl>
              <footer>
                <span>
                  {topic.flagship ? "旗舰路径 · 编制中" : "问题索引"}
                </span>
                <ArrowUpRight aria-hidden="true" size={16} />
              </footer>
            </Link>
          ))}
        </div>
        <Link className="v1-wide-link" href="/answers">
          浏览全部 30 个问题
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>

      <section className="v1-path-section" id="flagship">
        <div className="page-width">
          <header className="v1-section-heading inverted">
            <div>
              <p className="eyebrow">FLAGSHIP PATHS</p>
              <h2>六条路径，不许用阅读代替完成。</h2>
            </div>
            <p>
              路径必须要求真实行动、证据、产物和修订。当前版本先公开结构与编制状态，
              不把未完成内容伪装成正式课程。
            </p>
          </header>
          <div className="v1-flagship-list">
            {flagshipAnswerTopics.map((topic, index) => (
              <Link href={`/answers/${topic.slug}`} key={topic.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{topic.title}</strong>
                <em>{topic.artifact}</em>
                <small>编制中</small>
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v1-college-entry page-width">
        <header className="v1-section-heading">
          <div>
            <p className="eyebrow">THE COLLEGES</p>
            <h2>学科不是边界，是解决问题时可以调用的传统。</h2>
          </div>
          <p>
            学院保存根本问题与方法，专业组织长期能力，课程提供必要训练。
            你既可以从学院进入，也可以沿答案路径跨越多个学科。
          </p>
        </header>
        <div className="v1-college-cards">
          {universitySchools.slice(0, 4).map((school) => (
            <Link
              href={`/college/${school.slug}`}
              key={school.slug}
              style={{ "--school-accent": school.accent } as React.CSSProperties}
            >
              <CircleDot aria-hidden="true" size={17} />
              <span>{school.englishName}</span>
              <h3>{school.name}</h3>
              <p>{school.description}</p>
              <small>{school.programs.length} 个专业</small>
            </Link>
          ))}
        </div>
        <div className="v1-college-actions">
          <Link href="/college">
            <BookOpen aria-hidden="true" size={17} />
            查看 {universityStats.schools} 个学院
          </Link>
          <Link href="/answers">
            <Compass aria-hidden="true" size={17} />
            从真实问题进入
          </Link>
        </div>
      </section>

      <footer className="marketing-footer page-width">
        <span className="wordmark">Academia</span>
        <span>为第一次创造真实事物的人而建</span>
        <span>© 2026 Academia</span>
      </footer>
    </main>
  );
}
