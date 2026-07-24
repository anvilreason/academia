import Link from "next/link";
import { notFound } from "next/navigation";
import { AddProgramButton } from "@/components/features/university/AddProgramButton";
import { ProductShell } from "@/components/shared/ProductShell";
import {
  getUniversityProgram,
  getUniversitySchool,
} from "@/lib/content/university";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ programSlug: string }>;
}) {
  const { programSlug } = await params;
  const program = getUniversityProgram(programSlug);
  if (!program) notFound();
  const school = getUniversitySchool(program.schoolSlug);
  if (!school) notFound();

  return (
    <ProductShell active="college" context={school.name} title={program.name}>
      <section className="university-page">
        <nav className="academic-breadcrumb" aria-label="面包屑">
          <Link href="/college">学院地图</Link>
          <span>／</span>
          <Link href={`/college/${school.slug}`}>{school.name}</Link>
          <span>／</span>
          <strong>{program.name}</strong>
        </nav>

        <header className="program-hero">
          <div>
            <p className="eyebrow">
              {program.degree} · {program.duration}
            </p>
            <h1>{program.name}</h1>
            <p>{program.description}</p>
            <AddProgramButton programSlug={program.slug} />
          </div>
          <div
            className="credit-wheel"
            style={
              {
                "--credit-progress": "0deg",
                "--school-accent": school.accent,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{program.requiredCredits}</strong>
              <span>毕业学分</span>
            </div>
          </div>
        </header>

        <section className="credit-plan">
          <div className="university-section-heading compact">
            <div>
              <p className="eyebrow">培养方案</p>
              <h2>学分不是课程数量，而是培养结构</h2>
            </div>
            <p>所有课程通过后获得固定学分；成绩决定 0–4.0 绩点，并按学分加权计算 GPA。</p>
          </div>
          <div className="credit-band-list">
            {program.creditPlan.map((band) => (
              <div className="credit-band" key={band.label}>
                <div>
                  <strong>{band.label}</strong>
                  <span>{band.description}</span>
                </div>
                <div className="credit-band-bar">
                  <i
                    style={{
                      width: `${(band.credits / program.requiredCredits) * 100}%`,
                    }}
                  />
                </div>
                <b>{band.credits}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="program-courses">
          <div className="university-section-heading compact">
            <div>
              <p className="eyebrow">专业核心课程</p>
              <h2>从基础到毕业项目逐项完成</h2>
            </div>
            <p>每门课结束后进入期末考试；未通过的知识点可以单独重修，再次参加考试。</p>
          </div>
          <div className="course-table">
            {program.courses.map((course, index) => (
              <Link
                className="course-table-row"
                href={`/courses/${course.slug}`}
                key={course.slug}
              >
                <span className="course-sequence">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="course-code">{course.code}</span>
                <span className="course-table-title">
                  <strong>{course.title}</strong>
                  <small>{course.category}</small>
                </span>
                <span className="course-credit">{course.credits} 学分</span>
                <span className="course-state">
                  {course.availability === "open" ? "可学习" : "筹备中"}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </ProductShell>
  );
}
