import Link from "next/link";
import {
  universitySchools,
  universityStats,
} from "@/lib/content/university";

export default function LandingPage() {
  return (
    <main className="marketing-page">
      <div className="preview-notice">
        公开测试环境 · 请勿填写敏感信息或真实支付资料
      </div>

      <header className="marketing-header page-width">
        <Link className="wordmark" href="/" aria-label="Academia 首页">
          Academia
        </Link>
        <nav className="marketing-nav" aria-label="主导航">
          <Link href="/college">学院地图</Link>
          <Link href="/login">登录</Link>
          <Link className="button button-dark button-small" href="/learn/4p-stp">
            免费试听
          </Link>
        </nav>
      </header>

      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">一所围绕真实问题生长的 AI 大学</p>
          <h1>
            学会一个理论，
            <br />
            直到它改变你的判断。
          </h1>
          <p className="hero-lead">
            从学院、专业到课程建立完整培养路径。带着真实问题进入，
            让 AI 导师用苏格拉底式追问陪你学习，并用考试、学分与重修检验掌握。
          </p>
          <div className="hero-actions">
            <Link className="button button-accent button-large" href="/learn/4p-stp">
              免费试听 4P 与 STP
              <span aria-hidden="true">→</span>
            </Link>
            <span className="microcopy">无需登录 · 约 8 分钟</span>
          </div>
        </div>

        <div className="agent-card" aria-label="Academia 对话体验示例">
          <div className="agent-card-head">
            <div>
              <span className="status-dot" />
              <span>Academia 导师</span>
            </div>
            <span>4P 与 STP · 试听</span>
          </div>
          <div className="agent-card-body">
            <p className="agent-label">开始之前</p>
            <p className="agent-question">
              先别告诉我你想“学营销”。说一个你最近真的卡住的问题——最好是昨晚还在想的那种。
            </p>
            <div className="sample-answer">
              我做一个年付 ¥699 的设计工具，产品口碑不错，但增长已经连续三个月停住了。
            </div>
            <div className="agent-response">
              <span className="agent-mark">A</span>
              <p>
                好，我们先不背 4P。你直觉上认为卡住的是产品、价格、渠道，还是传播？只能选一个。
              </p>
            </div>
          </div>
          <div className="agent-composer">
            <span>在这里回答导师的问题…</span>
            <span className="send-mark" aria-hidden="true">
              ↑
            </span>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="page-width proof-grid">
          <div>
            <strong>一节课，一个真实决策</strong>
            <span>拒绝知识囤积，从你的问题出发</span>
          </div>
          <div>
            <strong>对话，而不是播放</strong>
            <span>导师根据你的回答继续追问</span>
          </div>
          <div>
            <strong>学完，留下认知资产</strong>
            <span>课程、笔记与连接永久进入地图</span>
          </div>
        </div>
      </section>

      <section className="curriculum page-width" id="curriculum">
        <div className="section-heading">
          <div>
          <p className="eyebrow">综合性大学 · 学院地图</p>
            <h2>先选择你想进入的学科共同体</h2>
          </div>
          <Link className="text-link" href="/college">
            浏览全部 {universityStats.schools} 个学院 →
          </Link>
        </div>
        <div className="landing-school-grid">
          {universitySchools.slice(0, 6).map((school, index) => (
            <Link
              className="landing-school-card"
              href={`/college/${school.slug}`}
              key={school.slug}
            >
              <span className="course-index">0{index + 1}</span>
              <span>
                <small>{school.englishName}</small>
                <strong>{school.name}</strong>
                <p>{school.description}</p>
              </span>
              <b>{school.programs.length} 个专业 ↗</b>
            </Link>
          ))}
        </div>
        <div className="landing-university-stats">
          <span><strong>{universityStats.schools}</strong>学院</span>
          <span><strong>{universityStats.programs}</strong>专业</span>
          <span><strong>{universityStats.courses}</strong>课程</span>
          <span><strong>4.0</strong>最高绩点</span>
        </div>
      </section>

      <section className="method-section">
        <div className="page-width method-grid">
          <div>
            <p className="eyebrow">为什么是对话</p>
            <h2>真正的学习，从你无法含糊过去的那一问开始。</h2>
          </div>
          <div className="method-copy">
            <p>
              Academia 不会连续给你十屏答案。导师一次只推进一个判断：
              先找到你的真实处境，再引入框架，最后要求你把它用回自己的业务。
            </p>
            <p>
              每节结束后，系统会根据对话生成反思笔记，并把新形成的概念连接保存在你的认知地图中。
            </p>
          </div>
        </div>
      </section>

      <section className="founder page-width">
        <div className="founder-monogram" aria-hidden="true">
          R
        </div>
        <blockquote>
          “我想做的不是一个更会回答问题的 AI，而是一位不允许你用漂亮话逃过思考的导师。”
        </blockquote>
        <p>— Reason，Academia 创始人</p>
      </section>

      <section className="final-cta page-width">
        <p className="eyebrow">先试一节，再决定</p>
        <h2>把你现在最棘手的问题带进来。</h2>
        <Link className="button button-accent button-large" href="/learn/4p-stp">
          开始免费对话 →
        </Link>
      </section>

      <footer className="marketing-footer page-width">
        <span className="wordmark">Academia</span>
        <span>认真思考，是一种长期主义。</span>
        <span>© 2026 Academia</span>
      </footer>
    </main>
  );
}
