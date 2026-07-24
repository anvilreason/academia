"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

type ProductShellProps = {
  children: React.ReactNode;
  active?: "home" | "college" | "learn";
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
  const { data: session } = useSession();
  const profileLabel =
    session?.user?.name || session?.user?.email || "建立学籍";
  const profileInitial = profileLabel.slice(0, 1).toUpperCase();
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
        <span aria-hidden="true">▦</span>
        学院地图
      </Link>
      <Link className="sidebar-action" href="/college">
        <span aria-hidden="true">＋</span>
        选择专业
      </Link>
      <Link
        className={`sidebar-link ${active === "home" ? "active" : ""}`}
        href="/home"
      >
        <span aria-hidden="true">⌂</span>
        今日学习
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
                    <span aria-hidden="true">▱</span>
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
            <Link href="/transcript">学籍与成绩</Link>
            <Link href="/wallet">学籍星图</Link>
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
            {menuOpen ? "×" : "☰"}
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
                讲义
              </button>
              <button className="ghost-control" type="button">
                进度
              </button>
            </div>
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
