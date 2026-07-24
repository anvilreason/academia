"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenText,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  Clock3,
  FolderKanban,
  GraduationCap,
  House,
  Map,
  MapPinned,
  Menu,
  SquarePen,
  WalletCards,
  Sparkles,
  X,
} from "lucide-react";

type ProductShellProps = {
  children: React.ReactNode;
  active?: "home" | "answers" | "college" | "learn" | "projects" | "agent";
  title?: string;
  context?: string;
};

export function ProductShell({
  children,
  active,
  title,
  context,
}: ProductShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const profileLabel =
    session?.user?.name || session?.user?.email || "建立学籍";
  const profileInitial = profileLabel.slice(0, 1).toUpperCase();
  const routeKind = pathname.startsWith("/college/")
    ? "school"
    : pathname.startsWith("/programs/")
      ? "program"
      : pathname.startsWith("/courses/")
        ? "course"
        : pathname.startsWith("/learn/")
          ? "learn"
          : pathname.startsWith("/answers/")
            ? "answer-path"
            : pathname === "/answers"
              ? "answers"
              : pathname === "/college"
                ? "atlas"
            : "workspace";
  const academicPlan = useQuery({
    queryKey: ["academic-plan", session?.user?.email],
    enabled: Boolean(session?.user),
    queryFn: async () => {
      const response = await fetch("/api/me/programs");
      if (!response.ok) return { programs: [], courses: [] };
      const payload = (await response.json()) as {
        data: {
          programs: Array<{ programSlug: string; name: string }>;
          courses: Array<{
            courseSlug: string;
            programSlug: string;
            title: string;
          }>;
        };
      };
      return payload.data;
    },
  });

  const navigation = (
    <>
      <Link
        className={`sidebar-link sidebar-map-link ${
          active === "college" ? "active" : ""
        }`}
        href="/college"
      >
        <Map aria-hidden="true" />
        学院地图
      </Link>
      <Link
        className={`sidebar-link ${active === "answers" ? "active" : ""}`}
        href="/answers"
      >
        <MapPinned aria-hidden="true" />
        答案地图
      </Link>
      <Link
        className={`sidebar-link ${active === "projects" ? "active" : ""}`}
        href="/projects"
      >
        <SquarePen aria-hidden="true" />
        我的课题
      </Link>
      <Link
        className={`sidebar-link ${active === "home" ? "active" : ""}`}
        href="/home"
      >
        <House aria-hidden="true" />
        今日学习
      </Link>
      <Link
        className={`sidebar-link ${active === "agent" ? "active" : ""}`}
        href="/agent"
      >
        <BrainCircuit aria-hidden="true" />
        Academia Agent
      </Link>
      {!!academicPlan.data?.programs.length && (
        <div className="sidebar-section sidebar-projects">
          <span className="sidebar-label">我的专业</span>
          {academicPlan.data.programs
            .slice(0, 5)
            .map(({ programSlug, name }) => {
              const courses = academicPlan.data.courses.filter(
                (course) => course.programSlug === programSlug,
              );
              return (
                <div className="sidebar-project" key={programSlug}>
                  <Link
                    className="sidebar-link"
                    href={`/programs/${programSlug}`}
                  >
                    <FolderKanban aria-hidden="true" />
                    {name}
                  </Link>
                  {courses.slice(0, 4).map(({ courseSlug, title }) => (
                    <Link
                      className="sidebar-task"
                      href={`/courses/${courseSlug}`}
                      key={courseSlug}
                    >
                      {title}
                    </Link>
                  ))}
                  {!courses.length && (
                    <span className="sidebar-empty-task">尚未新增课程</span>
                  )}
                </div>
              );
            })}
        </div>
      )}
      <div className="sidebar-section">
        <span className="sidebar-label">最近</span>
        <Link
          className={`sidebar-link ${active === "learn" ? "active" : ""}`}
          href="/learn/4p-stp"
        >
          <Clock3 aria-hidden="true" />
          4P 与 STP
        </Link>
      </div>
    </>
  );

  return (
    <div className="product-shell">
      <aside className="product-sidebar">
        <Link className="wordmark" href="/">
          Academia
        </Link>
        {navigation}
        <div className="sidebar-spacer" />
        {session && (
          <div className="sidebar-account-links">
            <Link href="/capabilities">
              <Sparkles aria-hidden="true" />
              能力档案
            </Link>
            <Link href="/transcript">
              <GraduationCap aria-hidden="true" />
              学籍与成绩
            </Link>
            <Link href="/wallet">
              <WalletCards aria-hidden="true" />
              学籍星图
            </Link>
          </div>
        )}
        <Link className="sidebar-profile" href={session ? "/home" : "/login"}>
          <span className="profile-avatar">
            {session ? profileInitial : "访"}
          </span>
          <span>{profileLabel}</span>
        </Link>
      </aside>

      <main className="workspace">
        <div className="mobile-product-header">
          <Link className="wordmark" href="/">
            Academia
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "关闭导航" : "打开导航"}
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            {menuOpen ? (
              <X aria-hidden="true" />
            ) : (
              <Menu aria-hidden="true" />
            )}
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-navigation">
            <nav onClick={() => setMenuOpen(false)}>{navigation}</nav>
            <Link
              className="mobile-account"
              href={session ? "/home" : "/login"}
              onClick={() => setMenuOpen(false)}
            >
              <span className="profile-avatar">
                {session ? profileInitial : "访"}
              </span>
              {profileLabel}
            </Link>
          </div>
        )}
        {(title || context) && (
          <header className="workspace-topbar">
            <div className="workspace-title">
              {title && <strong>{title}</strong>}
              {context && <span>{context}</span>}
            </div>
            <div className="workspace-actions">
              <button className="ghost-control" type="button">
                <BookOpenText aria-hidden="true" />
                讲义
              </button>
              <button className="ghost-control" type="button">
                <ChartNoAxesColumnIncreasing aria-hidden="true" />
                进度
              </button>
            </div>
          </header>
        )}
        <div
          className="route-stage"
          data-route-kind={routeKind}
          key={pathname}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
