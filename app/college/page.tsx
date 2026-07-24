import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
            <h1>知识有门类，思想没有边界。</h1>
            <p>
              十七个学院构成 Academia 的知识地形。你可以从一个专业开始，
              也可以沿着问题穿过不同学科；学院提供方向，不规定边界。
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
            <h2>从古老问题到尚未命名的问题</h2>
          </div>
          <p>
            学院保存一门学科的传统，专业组织长期的训练，课程把训练落实到每一次阅读、对话与实践。
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
                <strong>
                  查看学院
                  <ArrowRight aria-hidden="true" size={15} />
                </strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ProductShell>
  );
}
