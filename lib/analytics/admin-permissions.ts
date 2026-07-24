export const ADMIN_ROLES = [
  "owner",
  "admin",
  "growth",
  "operations",
  "analyst",
  "viewer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminSection =
  | "overview"
  | "growth"
  | "academics"
  | "users"
  | "geo"
  | "tracking"
  | "team";

const ROLE_SECTIONS: Record<AdminRole, ReadonlySet<AdminSection>> = {
  owner: new Set([
    "overview",
    "growth",
    "academics",
    "users",
    "geo",
    "tracking",
    "team",
  ]),
  admin: new Set([
    "overview",
    "growth",
    "academics",
    "users",
    "geo",
    "tracking",
  ]),
  growth: new Set(["overview", "growth", "tracking"]),
  operations: new Set(["overview", "academics", "users", "geo"]),
  analyst: new Set([
    "overview",
    "growth",
    "academics",
    "users",
    "geo",
    "tracking",
  ]),
  viewer: new Set(["overview"]),
};

export function isAdminRole(value: string): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function canAccessAdminSection(
  role: string,
  section: AdminSection,
) {
  return isAdminRole(role) && ROLE_SECTIONS[role].has(section);
}

export function adminRoleLabel(role: string) {
  const labels: Record<AdminRole, string> = {
    owner: "所有者",
    admin: "管理员",
    growth: "增长",
    operations: "运营",
    analyst: "数据分析",
    viewer: "只读访客",
  };
  return isAdminRole(role) ? labels[role] : role;
}
