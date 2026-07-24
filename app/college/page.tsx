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
              <span>核心课程</span>
            </div>
          </div>
        </header>

        <section className="academic-policy-strip">
          <div>
            <span>毕业要求</span>
            <strong>146–170 学分</strong>
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
            <h2>十二个学院，一张跨学科地图</h2>
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
      </section>
    </ProductShell>
  );
}
