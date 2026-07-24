import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CourseApplicationExplorer } from "@/components/features/university/CourseApplicationExplorer";
import { CourseRecognitionPanel } from "@/components/features/university/CourseRecognitionPanel";
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

        <section className="course-application">
          <div className="course-application-heading">
            <p className="eyebrow">这门课会在哪里派上用场</p>
            <h2>先看现实问题，再学习概念。</h2>
          </div>
          <CourseApplicationExplorer application={course.application} />
          <Link className="application-project-link" href="/projects">
            把这门课连接到我的实践项目
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>

        <div className="course-detail-grid">
          <section className="course-syllabus">
            <p className="eyebrow">课程结构</p>
            <h2>理解、运用，然后接受检验</h2>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>概念与问题边界</strong>
                  <p>从你的处境开始，澄清问题、前提，以及真正需要作出的判断。</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>案例推演与知识点练习</strong>
                  <p>让理论进入案例和现实，在使用中辨认它的力量与限度。</p>
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
              评价不是为了给学习画句号，而是帮助你找到仍需回去重做的部分。
            </p>
            {course.availability === "open" ? (
              <Link
                className="button button-accent button-block"
                href={`/checkout/${course.slug}`}
              >
                进入这门课
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            ) : (
              <button className="button button-dark button-block" disabled>
                课程正在编制
              </button>
            )}
          </aside>
        </div>
        <CourseRecognitionPanel courseSlug={course.slug} />
      </section>
    </ProductShell>
  );
}
