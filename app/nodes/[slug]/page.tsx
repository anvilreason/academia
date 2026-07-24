import { notFound, redirect } from "next/navigation";
import { getUniversityCourse } from "@/lib/content/university";

export default async function LegacyNodeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getUniversityCourse(slug)) notFound();
  redirect(`/courses/${slug}`);
}
