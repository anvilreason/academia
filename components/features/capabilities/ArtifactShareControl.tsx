"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Share2, X } from "lucide-react";

type ShareRecord = {
  publicSlug: string;
  status: string;
};

export function ArtifactShareControl({
  artifactId,
  artifactTitle,
  artifactVersion,
  initialShare,
}: {
  artifactId: string;
  artifactTitle: string;
  artifactVersion: number;
  initialShare: ShareRecord | null;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(
    `这份作品记录了我如何把一个真实问题转化为行动、证据、判断与修订，并通过 Academia 公开量规审阅。`,
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const share =
    initialShare?.status === "active" ? initialShare : null;
  const sharePath = share ? `/proof/${share.publicSlug}` : null;

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/me/artifacts/${artifactId}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${artifactTitle} · v${artifactVersion}`,
          summary,
        }),
      });
      const payload = (await response.json()) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message || "暂时无法生成公开证明");
      }
      setOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["capability-profile"],
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "暂时无法公开作品");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/me/artifacts/${artifactId}/share`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("暂时无法撤回公开证明");
      await queryClient.invalidateQueries({
        queryKey: ["capability-profile"],
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "暂时无法撤回");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!sharePath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (sharePath) {
    return (
      <div className="artifact-share-control active">
        <span>
          <Check aria-hidden="true" />
          公开证明已生成
        </span>
        <div>
          <a href={sharePath} rel="noreferrer" target="_blank">
            查看
            <ExternalLink aria-hidden="true" size={13} />
          </a>
          <button onClick={copyLink} type="button">
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "已复制" : "复制链接"}
          </button>
          <button disabled={busy} onClick={revoke} type="button">
            <X aria-hidden="true" />
            撤回
          </button>
        </div>
        {error && <small>{error}</small>}
      </div>
    );
  }

  return (
    <div className="artifact-share-control">
      {!open ? (
        <button onClick={() => setOpen(true)} type="button">
          <Share2 aria-hidden="true" />
          生成公开作品证明
        </button>
      ) : (
        <div className="artifact-share-form">
          <label htmlFor={`artifact-summary-${artifactId}`}>
            公开摘要
          </label>
          <textarea
            id={`artifact-summary-${artifactId}`}
            maxLength={360}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            value={summary}
          />
          <p>
            只公开作品、贡献边界和审阅结果；原始证据、邮箱与账户信息不会公开。
          </p>
          {error && <small>{error}</small>}
          <div>
            <button disabled={busy || summary.trim().length < 12} onClick={publish} type="button">
              {busy ? "正在生成…" : "确认公开"}
            </button>
            <button onClick={() => setOpen(false)} type="button">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
