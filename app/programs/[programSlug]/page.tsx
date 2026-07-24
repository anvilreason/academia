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
  const curriculumTotal = program.courses.reduce(
    (sum, course) => sum + course.credits,
    0,
  );
  const courseGroups = program.creditPlan.map((band) => ({
    band,
    courses: program.courses.filter(
      (course) => course.category === band.label,
    ),
  }));

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
              <p className="eyebrow">完整培养课程表</p>
              <h2>每一学分都落实到具体课程</h2>
            </div>
            <p>
              共 {program.courses.length} 门课，课程表合计 {curriculumTotal}{" "}
              学分；每门课结束后进入考试或实践评价。
            </p>
          </div>
          <div className="curriculum-audit">
            <span>课程表学分</span>
            <strong>{curriculumTotal}</strong>
            <i>=</i>
            <span>毕业要求</span>
            <strong>{program.requiredCredits}</strong>
            <b>已完整匹配 ✓</b>
          </div>
          <div className="course-groups">
            {courseGroups.map(({ band, courses }) => (
              <section className="course-group" key={band.label}>
                <header>
                  <div>
                    <span>{band.label}</span>
                    <strong>{band.description}</strong>
                  </div>
                  <div>
                    <b>{courses.length} 门</b>
                    <b>{band.credits} 学分</b>
                  </div>
                </header>
                <div className="course-table">
                  {courses.map((course) => (
                    <Link
                      className="course-table-row"
                      href={`/courses/${course.slug}`}
                      key={course.slug}
                    >
                      <span className="course-sequence">
                        {String(program.courses.indexOf(course) + 1).padStart(
                          2,
                          "0",
                        )}
                      </span>
                      <span className="course-code">{course.code}</span>
                      <span className="course-table-title">
                        <strong>{course.title}</strong>
                        <small>{course.category}</small>
                      </span>
                      <span className="course-credit">
                        {course.credits} 学分
                      </span>
                      <span className="course-state">
                        {course.availability === "open" ? "可学习" : "筹备中"}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </section>
    </ProductShell>
  );
}
