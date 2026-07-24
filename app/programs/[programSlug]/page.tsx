import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  FlaskConical,
  Lightbulb,
  NotebookTabs,
} from "lucide-react";
import { AddProgramButton } from "@/components/features/university/AddProgramButton";
import { ProgramCreditAudit } from "@/components/features/university/ProgramCreditAudit";
import { ProductShell } from "@/components/shared/ProductShell";
import {
  contentStatusLabels,
  courseContentStatus,
} from "@/lib/content/content-status";
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

        <ProgramCreditAudit programSlug={program.slug} />

        <section className="application-section program-application">
          <div className="university-section-heading compact">
            <div>
              <p className="eyebrow">学习之后，能够做什么</p>
              <h2>把专业能力带进真实世界</h2>
            </div>
            <p>{program.application.boundary}</p>
          </div>
          <div className="application-grid">
            <article>
              <Lightbulb aria-hidden="true" />
              <span>形成的能力</span>
              <ul>
                {program.application.capabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <BriefcaseBusiness aria-hidden="true" />
              <span>工作与生产实践</span>
              <ul>
                {program.application.workFields.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <FlaskConical aria-hidden="true" />
              <span>创业与新事物</span>
              <ul>
                {program.application.ventureFields.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <NotebookTabs aria-hidden="true" />
              <span>毕业时留下的成果</span>
              <ul>
                {program.application.portfolio.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
          <Link className="application-project-link" href="/projects">
            用一个真实项目贯穿这个专业
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>

        <section className="credit-plan">
          <div className="university-section-heading compact">
            <div>
              <p className="eyebrow">培养方案</p>
              <h2>一份培养方案，也是一种思考的秩序</h2>
            </div>
            <p>
              通识拓宽视野，基础建立语言，核心形成判断，选修允许偏离，
              实践要求你把所学带回现实。
            </p>
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
              <h2>每一学分，都对应一段真实的学习</h2>
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
            <b>学分校核通过 ✓</b>
          </div>
          <div className="course-groups">
            {courseGroups.map(({ band, courses }, groupIndex) => (
              <details
                className="course-group"
                key={band.label}
                open={groupIndex === 0}
              >
                <summary>
                  <div>
                    <span>{band.label}</span>
                    <strong>{band.description}</strong>
                  </div>
                  <div>
                    <b>{courses.length} 门</b>
                    <b>{band.credits} 学分</b>
                  </div>
                  <span className="course-group-toggle">展开</span>
                </summary>
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
                        {contentStatusLabels[courseContentStatus(course)]}
                      </span>
                      <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      </section>
    </ProductShell>
  );
}
