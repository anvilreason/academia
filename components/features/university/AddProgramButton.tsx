"use client";

import Link from "next/link";
import { useState } from "react";

export function AddProgramButton({ programSlug }: { programSlug: string }) {
  const [state, setState] = useState<
    "idle" | "busy" | "done" | "login" | "error"
  >("idle");

  async function addProgram() {
    setState("busy");
    const response = await fetch("/api/me/programs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ programSlug }),
    });
    if (response.status === 401) return setState("login");
    setState(response.ok ? "done" : "error");
  }

  if (state === "login") {
    return (
      <Link
        className="button button-accent"
        href={`/login?mode=register&continue=${encodeURIComponent(
          `/programs/${programSlug}`,
        )}`}
      >
        建立学籍后选择专业 →
      </Link>
    );
  }

  return (
    <div className="add-program-action">
      <button
        className="button button-accent"
        disabled={state === "busy" || state === "done"}
        onClick={addProgram}
        type="button"
      >
        {state === "busy"
          ? "正在加入…"
          : state === "done"
            ? "已列入我的培养方案 ✓"
            : "选择为我的专业 ＋"}
      </button>
      {state === "error" && <span>暂时无法登记，请稍后再试。</span>}
    </div>
  );
}
