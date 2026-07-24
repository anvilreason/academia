"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  FlaskConical,
  Gauge,
  NotebookPen,
} from "lucide-react";
import type { CourseApplication } from "@/lib/content/university";

const views = [
  { id: "judgment", label: "判断", icon: Gauge },
  { id: "work", label: "工作", icon: BriefcaseBusiness },
  { id: "venture", label: "创业", icon: FlaskConical },
  { id: "artifact", label: "成果", icon: NotebookPen },
] as const;

export function CourseApplicationExplorer({
  application,
}: {
  application: CourseApplication;
}) {
  const [active, setActive] =
    useState<(typeof views)[number]["id"]>("judgment");
  const content = {
    judgment: {
      kicker: "它帮助你判断",
      title: application.questions[0],
      items: application.questions,
      note: "先确认真正的问题，再选择知识与工具。",
    },
    work: {
      kicker: "进入生产实践",
      title: application.workScenes[0],
      items: application.workScenes,
      note: "知识必须能够改变一次真实的判断、协作或交付。",
    },
    venture: {
      kicker: "进入创业现场",
      title: application.ventureScenes[0],
      items: application.ventureScenes,
      note: "把概念变成可以被市场、用户和资源约束检验的假设。",
    },
    artifact: {
      kicker: "留下可验证成果",
      title: application.deliverable,
      items: [application.deliverable],
      note: application.boundary,
    },
  }[active];

  return (
    <div className="course-application-explorer">
      <nav aria-label="课程应用场景">
        {views.map(({ id, label, icon: Icon }) => (
          <button
            aria-pressed={active === id}
            className={active === id ? "active" : ""}
            key={id}
            onClick={() => setActive(id)}
            type="button"
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <article key={active}>
        <span>{content.kicker}</span>
        <h3>{content.title}</h3>
        <ul>
          {content.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{content.note}</p>
      </article>
    </div>
  );
}
