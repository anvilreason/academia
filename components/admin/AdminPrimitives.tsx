import type { LucideIcon } from "lucide-react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="observatory-page-header">
      <div>
        <p className="observatory-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions}
    </header>
  );
}

export function AdminMetric({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "green" | "blue" | "amber";
}) {
  return (
    <article className={`observatory-metric ${tone ?? ""}`}>
      <div>
        <span>{label}</span>
        <Icon aria-hidden="true" size={16} />
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="observatory-empty-note">{children}</p>;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatPercent(value: number | null) {
  return value === null ? "观察中" : `${value}%`;
}

export function formatDateTime(value: string | null) {
  if (!value) return "尚无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
