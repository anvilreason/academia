import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductShell } from "@/components/shared/ProductShell";
import { getUniversityCourse } from "@/lib/content/university";

export default async function CourseCatalogPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const result = getUniversityCourse(courseSlug);
  if (!result) notFound();
  const { course, program, school } = result;

  return (
    <ProductShell active="college" context={`${course.credits} 学分`} title={course.title}>
      <section className="university-page course-catalog-page">
        <nav className="academic-breadcrumb" aria-label="面包屑">
          <Link href="/college">学院地图</Link>
          <span>／</span>
          <Link href={`/college/${school.slug}`}>{school.name}</Link>
          <span>／</span>
          <Link href={`/programs/${program.slug}`}>{program.name}</Link>
          <span>／</span>
          <strong>{course.title}</strong>
        </nav>

        <header className="course-catalog-hero">
          <div>
            <div className="course-labels">
              <span>{course.code}</span>
              <span>{course.category}</span>
              <span>{course.credits} 学分</span>
            </div>
            <h1>{course.title}</h1>
            <p>{course.summary}</p>
          </div>
          <div className="course-credit-seal">
            <strong>{course.credits}</strong>
            <span>CREDITS</span>
          </div>
        </header>

        <div className="course-detail-grid">
          <section className="course-syllabus">
            <p className="eyebrow">课程结构</p>
            <h2>先学、再用、最后接受检验</h2>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>概念与问题边界</strong>
                  <p>通过 AI 导师追问，明确这门课程要解决的真实问题。</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>案例推演与知识点练习</strong>
                  <p>用个人情境验证理论，系统记录已掌握与薄弱知识点。</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>期末考试</strong>
                  <p>百分制考试结合学习过程；60 分通过，90 分以上获得 4.0 绩点。</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>定向重修</strong>
                  <p>未掌握部分会生成重修清单，不需要从头重复整门课程。</p>
                </div>
              </li>
            </ol>
          </section>

          <aside className="course-assessment">
            <p className="eyebrow">评价方式</p>
            <dl>
              <div>
                <dt>过程学习</dt>
                <dd>{100 - course.examWeight}%</dd>
              </div>
              <div>
                <dt>期末考试</dt>
                <dd>{course.examWeight}%</dd>
              </div>
              <div>
                <dt>最高绩点</dt>
                <dd>4.0</dd>
              </div>
              <div>
                <dt>通过线</dt>
                <dd>60</dd>
              </div>
            </dl>
            <p className="assessment-note">
              费用不会在课程地图中展示。只有当你决定开始学习时，才会进入独立确认页。
            </p>
            {course.availability === "open" ? (
              <Link
                className="button button-accent button-block"
                href={`/checkout/${course.slug}`}
              >
                决定开始学习 →
              </Link>
            ) : (
              <button className="button button-dark button-block" disabled>
                加入待开放清单
              </button>
            )}
          </aside>
        </div>
      </section>
    </ProductShell>
  );
}
