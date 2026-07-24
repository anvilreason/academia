import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductShell } from "@/components/shared/ProductShell";
import { getUniversitySchool } from "@/lib/content/university";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = getUniversitySchool(schoolSlug);
  if (!school) notFound();
  const courses = school.programs.reduce(
    (total, program) => total + program.courses.length,
    0,
  );

  return (
    <ProductShell active="college" context={school.discipline} title={school.name}>
      <section className="university-page">
        <nav className="academic-breadcrumb" aria-label="面包屑">
          <Link href="/college">学院地图</Link>
          <span>／</span>
          <strong>{school.name}</strong>
        </nav>
        <header
          className="school-hero"
          style={{ "--school-accent": school.accent } as React.CSSProperties}
        >
          <div>
            <p className="eyebrow">{school.englishName}</p>
            <h1>{school.name}</h1>
            <p>{school.description}</p>
          </div>
          <dl>
            <div>
              <dt>下辖专业</dt>
              <dd>{school.programs.length}</dd>
            </div>
            <div>
              <dt>培养课程</dt>
              <dd>{courses}</dd>
            </div>
            <div>
              <dt>学科门类</dt>
              <dd>{school.discipline}</dd>
            </div>
          </dl>
        </header>

        <div className="university-section-heading compact">
          <div>
            <p className="eyebrow">专业项目</p>
            <h2>选择一条值得长期走下去的路</h2>
          </div>
          <p>
            专业不是身份标签，而是一组持续数年的问题、方法与实践。
            你可以从这里建立主修，也可以把它作为穿行知识的入口。
          </p>
        </div>

        <div className="program-grid">
          {school.programs.map((program, index) => (
            <Link
              className="program-card"
              href={`/programs/${program.slug}`}
              key={program.slug}
            >
              <div className="program-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="program-card-copy">
                <span>
                  {program.degree} · {program.duration}
                </span>
                <h3>{program.name}</h3>
                <p>{program.description}</p>
                <div className="program-meta">
                  <strong>{program.requiredCredits} 学分</strong>
                  <span>{program.courses.length} 门培养课程</span>
                </div>
              </div>
              <span className="program-arrow">
                <ArrowRight aria-hidden="true" size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </ProductShell>
  );
}
