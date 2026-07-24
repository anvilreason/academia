"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Gauge,
  Link2,
  MapPinned,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  canAccessAdminSection,
  type AdminRole,
  type AdminSection,
} from "@/lib/analytics/admin-permissions";

const entries: Array<{
  href: string;
  label: string;
  section: AdminSection;
  icon: typeof Gauge;
}> = [
  { href: "/admin", label: "总览", section: "overview", icon: Gauge },
  {
    href: "/admin/growth",
    label: "增长与留存",
    section: "growth",
    icon: BarChart3,
  },
  {
    href: "/admin/academics",
    label: "学院与专业",
    section: "academics",
    icon: BookOpenCheck,
  },
  {
    href: "/admin/users",
    label: "用户",
    section: "users",
    icon: UsersRound,
  },
  {
    href: "/admin/geo",
    label: "地域",
    section: "geo",
    icon: MapPinned,
  },
  {
    href: "/admin/tracking",
    label: "渠道追踪",
    section: "tracking",
    icon: Link2,
  },
  {
    href: "/admin/team",
    label: "团队与权限",
    section: "team",
    icon: ShieldCheck,
  },
];

export function AdminNav({ role }: { role: AdminRole | null }) {
  const pathname = usePathname();
  if (!role) return null;
  return (
    <nav aria-label="管理后台导航">
      {entries
        .filter((entry) => canAccessAdminSection(role, entry.section))
        .map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              className={active ? "active" : undefined}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={17} />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
