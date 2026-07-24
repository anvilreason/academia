import { PracticeProjects } from "@/components/features/projects/PracticeProjects";
import { ProductShell } from "@/components/shared/ProductShell";

export default function ProjectsPage() {
  return (
    <ProductShell active="projects" context="把学习带回现实" title="实践项目">
      <section className="content-page projects-page">
        <PracticeProjects />
      </section>
    </ProductShell>
  );
}
