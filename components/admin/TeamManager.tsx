"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck, UserRoundCog, X } from "lucide-react";
import { adminRoleLabel } from "@/lib/analytics/admin-permissions";

type Member = {
  id: string;
  email: string;
  role: string;
  status: string;
  userId: string | null;
  lastAccessAt: string | null;
  createdAt: string;
};

const ASSIGNABLE_ROLES = [
  "admin",
  "growth",
  "operations",
  "analyst",
  "viewer",
];

export function TeamManager({ members }: { members: Member[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        role: form.get("role"),
      }),
    });
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setMessage(payload.error?.message ?? "暂时无法添加成员");
      setPending(false);
      return;
    }
    event.currentTarget.reset();
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  async function updateMember(
    id: string,
    role: string,
    status: string,
  ) {
    setPending(true);
    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, role, status }),
    });
    setPending(false);
    if (response.ok) router.refresh();
  }

  return (
    <>
      <div className="team-actions">
        <button
          className="observatory-primary-button"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={15} />
          添加团队成员
        </button>
      </div>
      {open && (
        <div className="admin-modal-backdrop" role="presentation">
          <section
            aria-labelledby="new-member-title"
            aria-modal="true"
            className="admin-modal compact"
            role="dialog"
          >
            <header>
              <div>
                <p className="observatory-kicker">TEAM ACCESS</p>
                <h2 id="new-member-title">添加后台成员</h2>
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
            <form className="admin-form" onSubmit={addMember}>
              <label>
                成员邮箱
                <input
                  autoComplete="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  type="email"
                />
                <small>成员需要使用同一邮箱注册或登录 Academia</small>
              </label>
              <label>
                团队角色
                <select defaultValue="operations" name="role">
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {adminRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
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
                  <ShieldCheck aria-hidden="true" size={15} />
                  {pending ? "正在添加…" : "授予访问权限"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <div className="team-member-list">
        {members.map((member) => {
          const owner = member.role === "owner";
          return (
            <article key={member.id}>
              <span className={`member-avatar ${member.status}`}>
                {member.email.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{member.email}</strong>
                <small>
                  {member.userId ? "已绑定 Academia 账户" : "等待首次登录"}
                </small>
              </div>
              {owner ? (
                <span className="role-badge owner">
                  <ShieldCheck size={13} />
                  所有者
                </span>
              ) : (
                <>
                  <label className="inline-select">
                    <UserRoundCog aria-hidden="true" size={14} />
                    <select
                      aria-label={`${member.email} 的角色`}
                      value={member.role}
                      disabled={pending}
                      onChange={(event) =>
                        updateMember(
                          member.id,
                          event.target.value,
                          member.status,
                        )
                      }
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {adminRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className={`member-status ${member.status}`}
                    disabled={pending}
                    onClick={() =>
                      updateMember(
                        member.id,
                        member.role,
                        member.status === "active"
                          ? "suspended"
                          : "active",
                      )
                    }
                    type="button"
                  >
                    {member.status === "active" ? "暂停访问" : "恢复访问"}
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
