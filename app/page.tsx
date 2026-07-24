import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText } from "lucide-react";
import {
  universitySchools,
  universityStats,
} from "@/lib/content/university";

const principles = [
  {
    number: "01",
    title: "不崇拜权威",
    text: "名字可以被引用，结论必须重新推导。任何理论都要经得起你的问题。",
  },
  {
    number: "02",
    title: "不归顺主义",
    text: "观点不是阵营。我们保留矛盾，也保留改变立场的自由。",
  },
  {
    number: "03",
    title: "不接受边界",
    text: "学科是进入知识的门，不是阻止你穿行的墙。",
  },
];

export default function LandingPage() {
  return (
    <main className="marketing-page">
      <div className="preview-notice">
        先行校区 · Academia 正在创建中，请勿在此留下敏感资料
      </div>

      <header className="marketing-header page-width">
        <Link className="wordmark" href="/" aria-label="Academia 首页">
          Academia
        </Link>
        <nav className="marketing-nav" aria-label="主导航">
          <Link href="/college">学院</Link>
          <Link href="/login">学籍入口</Link>
          <Link className="button button-light button-small" href="/learn/4p-stp">
            进入课堂
          </Link>
        </nav>
      </header>

      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">ACADEMIA · A UNIVERSITY WITHOUT BORDERS</p>
          <h1>
            从真实问题出发，
            <br />
            形成自己的判断。
          </h1>
          <p className="hero-lead">
            Academia 是一所生长在问题上的大学。我们不把知识陈列在你面前，
            而是与你一起把它带进工作、创业与生活，直到它成为可以使用、可以质疑、
            也可以由你继续改写的判断。
          </p>
          <div className="hero-actions">
            <Link className="button button-signal button-large" href="/college">
              展开学院地图
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
            <Link className="hero-secondary-link" href="/learn/4p-stp">
              旁听第一堂课
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </div>

        <aside className="manifesto-board" aria-label="Academia 学术札记">
          <div className="manifesto-stamp">
            <BookOpenText aria-hidden="true" size={16} />
            FOUNDING NOTE / 2026
          </div>
          <blockquote>
            Nullius in verba
            <strong>不以任何人的话为最终依据。</strong>
          </blockquote>
          <div className="manifesto-crossed">
            <span>一门课，回应一个真实问题。</span>
            <span>一种方法，必须说明自己的边界。</span>
            <span>一次学习，留下可以被检验的成果。</span>
          </div>
          <div className="manifesto-foot">
            <span>{universityStats.schools} 学院</span>
            <span>{universityStats.programs} 专业</span>
            <span>{universityStats.courses.toLocaleString("zh-CN")} 课程</span>
          </div>
        </aside>
      </section>

      <section className="proof-strip">
        <div className="page-width principle-grid">
          {principles.map((principle) => (
            <article key={principle.number}>
              <span>{principle.number}</span>
              <h2>{principle.title}</h2>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="curriculum page-width" id="curriculum">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE OPEN FACULTIES</p>
            <h2>知识有门类，思想没有边界。</h2>
          </div>
          <Link className="text-link" href="/college">
            查看全部 {universityStats.schools} 个学院
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <div className="landing-school-grid">
          {universitySchools.slice(0, 6).map((school, index) => (
            <Link
              className="landing-school-card"
              href={`/college/${school.slug}`}
              key={school.slug}
            >
              <span className="course-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <small>{school.englishName}</small>
                <strong>{school.name}</strong>
                <p>{school.description}</p>
              </span>
              <b>
                {school.programs.length} 个专业
                <ArrowUpRight aria-hidden="true" size={14} />
              </b>
            </Link>
          ))}
        </div>
        <div className="landing-university-stats">
          <span>
            <strong>{universityStats.schools}</strong>学院
          </span>
          <span>
            <strong>{universityStats.programs}</strong>专业
          </span>
          <span>
            <strong>{universityStats.courses}</strong>课程
          </span>
          <span>
            <strong>4.0</strong>学术评价
          </span>
        </div>
      </section>

      <section className="method-section">
        <div className="page-width method-grid">
          <div>
            <p className="eyebrow">THE CLASS BEGINS WITH DISSENT</p>
            <h2>课堂，从不同意开始。</h2>
          </div>
          <div className="method-copy">
            <p>
              你不必先接受一套理论。带着真实处境进入，导师会追问你的前提、
              证据和选择；概念只在它能照亮问题时出现。
            </p>
            <p>
              学习不是记住一个人的答案。它是形成自己的判断，经受检验，
              发现薄弱之处，再回来重做一次。
            </p>
          </div>
        </div>
      </section>

      <section className="declaration page-width">
        <p className="eyebrow">OUR ONLY DOCTRINE</p>
        <div className="declaration-grid">
          <h2>我们唯一坚持的，<br />是不要求你坚持什么。</h2>
          <div>
            <p>
              在这里，保守与激进、科学与诗、技术与伦理可以坐在同一张桌前。
              没有思想因为不合时宜而被拒绝，也没有结论因为足够流行而免于质疑。
            </p>
            <p>
              你可以建立一个专业，也可以穿过十个学院。路径由问题决定，
              不是由标签决定。
            </p>
          </div>
        </div>
      </section>

      <section className="final-cta page-width">
        <p className="eyebrow">BEGIN WITH A QUESTION</p>
        <h2>校门不在这里。<br />它从你的第一个问题开始。</h2>
        <div className="final-links">
          <Link href="/college">
            去学院里走走
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <Link href="/learn/4p-stp">
            进入对话课堂
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>

      <footer className="marketing-footer page-width">
        <span className="wordmark">Academia</span>
        <span>Nullius in verba · 不以任何人的话为最终依据</span>
        <span>© 2026 Academia</span>
      </footer>
    </main>
  );
}
