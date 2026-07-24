import Link from "next/link";
import { ProductShell } from "@/components/shared/ProductShell";
import {
  universitySchools,
  universityStats,
} from "@/lib/content/university";

export default function UniversityMapPage() {
  return (
    <ProductShell active="college" context="综合学术地图" title="学院地图">
      <section className="university-page">
        <header className="university-hero">
          <div>
            <p className="eyebrow">ACADEMIA UNIVERSITY</p>
            <h1>先选择学院，再建立你的专业。</h1>
            <p>
              这里不是一张课程促销页，而是一所综合性大学的学术地图。
              从学院进入专业，再从培养方案选择课程；课程内容只在最后一层出现。
            </p>
          </div>
          <div className="university-stats" aria-label="学院地图规模">
            <div>
              <strong>{universityStats.schools}</strong>
              <span>学院</span>
            </div>
            <div>
              <strong>{universityStats.programs}</strong>
              <span>专业</span>
            </div>
            <div>
              <strong>{universityStats.courses}</strong>
              <span>培养课程</span>
            </div>
          </div>
        </header>

        <section className="academic-policy-strip">
          <div>
            <span>毕业要求</span>
            <strong>
              {universityStats.minCredits}–{universityStats.maxCredits} 学分
            </strong>
          </div>
          <div>
            <span>课程评价</span>
            <strong>期末考试 + 过程学习</strong>
          </div>
          <div>
            <span>成绩制度</span>
            <strong>4.0 加权平均绩点</strong>
          </div>
          <div>
            <span>未掌握内容</span>
            <strong>按知识点重修</strong>
          </div>
        </section>

        <div className="university-section-heading">
          <div>
            <p className="eyebrow">学院总览</p>
            <h2>从基础学科到医学与可持续发展</h2>
          </div>
          <p>
            学院对应知识领域，专业对应你的长期项目，课程对应需要逐项完成的学习任务。
          </p>
        </div>

        <div className="school-grid">
          {universitySchools.map((school, index) => (
            <Link
              className="school-card"
              href={`/college/${school.slug}`}
              key={school.slug}
              style={{ "--school-accent": school.accent } as React.CSSProperties}
            >
              <div className="school-card-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <em>{school.discipline}</em>
              </div>
              <div>
                <h3>{school.name}</h3>
                <p className="school-english">{school.englishName}</p>
                <p>{school.description}</p>
              </div>
              <div className="program-preview">
                {school.programs.map((program) => (
                  <span key={program.slug}>{program.name}</span>
                ))}
              </div>
              <div className="school-card-foot">
                <span>{school.programs.length} 个专业</span>
                <strong>进入学院 →</strong>
              </div>
            </Link>
          ))}
        </div>

        <section className="catalog-sources">
          <div>
            <p className="eyebrow">目录编制依据</p>
            <h2>参考顶尖大学，但不复制任何一所大学。</h2>
            <p>
              学院结构综合中国综合性研究型大学的学科门类，与斯坦福式跨学科项目组织方式；专业名称经过本产品统一整理。
            </p>
          </div>
          <div className="catalog-source-links">
            <a
              href="https://www.tsinghua.edu.cn/jyjx/bksjy/bkzy.htm"
              rel="noreferrer"
              target="_blank"
            >
              <span>清华大学</span>
              <strong>2026 本科专业设置</strong>
              <em>工程、医学、建筑与双学士项目 ↗</em>
            </a>
            <a
              href="https://dean.pku.edu.cn/web/about.php"
              rel="noreferrer"
              target="_blank"
            >
              <span>北京大学</span>
              <strong>本科教学与交叉培养</strong>
              <em>134 个本科专业及跨学科培养 ↗</em>
            </a>
            <a
              href="https://majors.stanford.edu/majors"
              rel="noreferrer"
              target="_blank"
            >
              <span>Stanford University</span>
              <strong>Undergraduate Majors</strong>
              <em>跨学院与个性化专业路径 ↗</em>
            </a>
          </div>
        </section>
      </section>
    </ProductShell>
  );
}
