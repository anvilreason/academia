"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Pause, Play, Plus, X } from "lucide-react";

type TrackingLinkRow = {
  id: string;
  code: string;
  name: string;
  targetPath: string;
  source: string;
  medium: string;
  campaign: string;
  status: string;
  visitors: number;
  signups: number;
  learners: number;
  payments: number;
  signupRate: number;
  createdAt: string;
};

export function TrackingLinkManager({
  links,
  canWrite,
  baseUrl,
}: {
  links: TrackingLinkRow[];
  canWrite: boolean;
  baseUrl: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function createLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/tracking-links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        targetPath: form.get("targetPath"),
        source: form.get("source"),
        medium: form.get("medium"),
        campaign: form.get("campaign"),
      }),
    });
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setMessage(payload.error?.message ?? "暂时无法创建链接");
      setPending(false);
      return;
    }
    event.currentTarget.reset();
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    setPending(true);
    const response = await fetch("/api/admin/tracking-links", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setPending(false);
    if (response.ok) router.refresh();
  }

  async function copy(code: string) {
    const url = `${window.location.origin}/r/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(code);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <>
      {canWrite && (
        <button
          className="observatory-primary-button"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={15} />
          新建追踪链接
        </button>
      )}
      {open && (
        <div className="admin-modal-backdrop" role="presentation">
          <section
            aria-labelledby="new-link-title"
            aria-modal="true"
            className="admin-modal"
            role="dialog"
          >
            <header>
              <div>
                <p className="observatory-kicker">NEW TRACKING LINK</p>
                <h2 id="new-link-title">建立渠道追踪链接</h2>
              </div>
              <button
                aria-label="关闭"
                className="icon-button"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <form className="admin-form" onSubmit={createLink}>
              <label>
                链接名称
                <input name="name" placeholder="小红书 · 创业课程介绍" required />
              </label>
              <label>
                目标页面
                <input
                  defaultValue="/"
                  name="targetPath"
                  placeholder="/college"
                  required
                />
                <small>仅允许 Academia 站内路径</small>
              </label>
              <div className="form-grid-three">
                <label>
                  来源
                  <input name="source" placeholder="xiaohongshu" required />
                </label>
                <label>
                  媒介
                  <input name="medium" placeholder="social" required />
                </label>
                <label>
                  活动
                  <input name="campaign" placeholder="launch-01" required />
                </label>
              </div>
              {message && <p className="form-error">{message}</p>}
              <footer>
                <button
                  className="observatory-secondary-button"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="observatory-primary-button"
                  disabled={pending}
                  type="submit"
                >
                  <Link2 aria-hidden="true" size={15} />
                  {pending ? "正在建立…" : "建立链接"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <div className="tracking-link-list">
        {links.map((link) => (
          <article className="tracking-link-row" key={link.id}>
            <div className="tracking-link-main">
              <div>
                <span className={`status-dot ${link.status}`} />
                <strong>{link.name}</strong>
                <small>{link.source} / {link.medium} / {link.campaign}</small>
              </div>
              <div className="tracking-url">
                <code>{baseUrl}/r/{link.code}</code>
                <button
                  aria-label="复制追踪链接"
                  onClick={() => copy(link.code)}
                  type="button"
                >
                  {copied === link.code ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <small>前往 {link.targetPath}</small>
            </div>
            <dl>
              <div><dt>访问</dt><dd>{link.visitors}</dd></div>
              <div><dt>注册</dt><dd>{link.signups}</dd></div>
              <div><dt>学习</dt><dd>{link.learners}</dd></div>
              <div><dt>完成选课</dt><dd>{link.payments}</dd></div>
              <div><dt>注册率</dt><dd>{link.signupRate}%</dd></div>
            </dl>
            {canWrite && (
              <button
                className="link-status-button"
                disabled={pending}
                onClick={() =>
                  setStatus(
                    link.id,
                    link.status === "active" ? "paused" : "active",
                  )
                }
                type="button"
              >
                {link.status === "active" ? <Pause size={13} /> : <Play size={13} />}
                {link.status === "active" ? "暂停" : "启用"}
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
