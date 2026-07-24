"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";
import type { PracticeProjectRecord } from "@/lib/repositories/types";

type ProjectDraft = {
  title: string;
  context: string;
  goal: string;
};

const emptyDraft: ProjectDraft = { title: "", context: "", goal: "" };

export function PracticeProjects() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);

  const projects = useQuery({
    queryKey: ["practice-projects"],
    enabled: Boolean(session?.user),
    queryFn: async () => {
      const response = await fetch("/api/me/projects");
      if (!response.ok) throw new Error("PROJECTS_UNAVAILABLE");
      const payload = (await response.json()) as {
        data: PracticeProjectRecord[];
      };
      return payload.data;
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/me/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as {
        data?: PracticeProjectRecord;
        error?: { message: string };
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "暂时无法保存项目");
      }
      return payload.data;
    },
    onSuccess: (project) => {
      queryClient.setQueryData<PracticeProjectRecord[]>(
        ["practice-projects"],
        (current = []) => [project, ...current],
      );
      setDraft(emptyDraft);
      setFormOpen(false);
    },
  });

  if (status === "loading") {
    return <div className="project-state">正在打开你的项目册…</div>;
  }

  if (!session?.user) {
    return (
      <section className="project-signin">
        <BriefcaseBusiness aria-hidden="true" />
        <div>
          <h2>把真实问题带进课堂</h2>
          <p>
            建立学籍后，你可以保存正在做的工作、创业或研究项目，并让每门课围绕同一个真实问题积累成果。
          </p>
        </div>
        <Link className="button button-dark" href="/login?mode=register&continue=/projects">
          建立学籍
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
    );
  }

  return (
    <div className="projects-workspace">
      <div className="projects-heading">
        <div>
          <p className="eyebrow">REAL-WORLD STUDIO</p>
          <h1>让知识在你的项目里留下结果。</h1>
          <p>
            项目可以来自工作、创业、研究或生活。课程将围绕这段真实处境组织案例、练习与成果。
          </p>
        </div>
        <button
          className="button button-dark project-new-button"
          onClick={() => setFormOpen((value) => !value)}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          新建项目
        </button>
      </div>

      {formOpen && (
        <form
          className="project-form"
          onSubmit={(event) => {
            event.preventDefault();
            createProject.mutate();
          }}
        >
          <label>
            项目名称
            <input
              maxLength={80}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="例如：让独立设计工作室重新获得增长"
              required
              value={draft.title}
            />
          </label>
          <label>
            真实处境
            <textarea
              maxLength={800}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  context: event.target.value,
                }))
              }
              placeholder="发生了什么？谁受影响？你已经知道哪些事实？"
              required
              rows={5}
              value={draft.context}
            />
          </label>
          <label>
            希望改变的结果
            <textarea
              maxLength={400}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  goal: event.target.value,
                }))
              }
              placeholder="如果学习真正有用，三个月后会出现什么不同？"
              required
              rows={3}
              value={draft.goal}
            />
          </label>
          <div className="project-form-actions">
            <button
              className="button button-dark"
              disabled={createProject.isPending}
              type="submit"
            >
              {createProject.isPending ? "正在保存…" : "保存项目"}
            </button>
            <button
              className="text-button"
              onClick={() => setFormOpen(false)}
              type="button"
            >
              取消
            </button>
          </div>
          {createProject.error && (
            <p className="form-error">{createProject.error.message}</p>
          )}
        </form>
      )}

      {projects.isLoading ? (
        <div className="project-state">正在读取项目…</div>
      ) : projects.data?.length ? (
        <div className="project-list">
          {projects.data.map((project, index) => (
            <article className="project-card" key={project.id}>
              <span className="project-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <span className="project-status">进行中</span>
                <h2>{project.title}</h2>
                <p>{project.context}</p>
                <dl>
                  <dt>期待的改变</dt>
                  <dd>{project.goal}</dd>
                </dl>
              </div>
              <BriefcaseBusiness aria-hidden="true" size={20} />
            </article>
          ))}
        </div>
      ) : (
        <section className="project-empty">
          <BriefcaseBusiness aria-hidden="true" size={24} />
          <h2>从一个尚未解决的问题开始</h2>
          <p>
            不必先写成完美的项目计划。记录真实处境和希望改变的结果，就足以让第一门课从现实出发。
          </p>
        </section>
      )}
    </div>
  );
}
