import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductShell } from "@/components/shared/ProductShell";
import { TestCheckout } from "@/components/features/commerce/TestCheckout";
import { getUniversityCourse } from "@/lib/content/university";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const result = getUniversityCourse(courseSlug);
  if (!result || result.course.availability !== "open") notFound();
  const { course, program } = result;
  const isOpenLecture = course.slug === "4p-stp";

  return (
    <ProductShell active="college" context="选课登记" title={course.title}>
      <section className="university-page checkout-page">
        <nav className="academic-breadcrumb" aria-label="面包屑">
          <Link href={`/programs/${program.slug}`}>{program.name}</Link>
          <span>／</span>
          <Link href={`/courses/${course.slug}`}>{course.title}</Link>
          <span>／</span>
          <strong>选课登记</strong>
        </nav>
        <div className="checkout-course-card">
          <div>
            <p className="eyebrow">COURSE ENROLMENT</p>
            <h1>{course.title}</h1>
            <p>{course.summary}</p>
            <div className="checkout-course-meta">
              <span>{course.credits} 学分</span>
              <span>期末考试</span>
              <span>最高绩点 4.0</span>
            </div>
          </div>
          {isOpenLecture ? (
            <div className="free-course-start">
              <strong>开放旁听</strong>
              <p>这堂课向所有来访者开放，不计入正式学籍。</p>
              <Link className="button button-accent button-block" href="/learn/4p-stp">
                进入课堂 →
              </Link>
            </div>
          ) : (
            <TestCheckout nodeSlug={course.slug} />
          )}
        </div>
      </section>
    </ProductShell>
  );
}
