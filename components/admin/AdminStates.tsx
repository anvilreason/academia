import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function AdminDenied({
  email,
  section,
}: {
  email: string;
  section?: boolean;
}) {
  return (
    <section className="observatory-access-state">
      <ShieldAlert aria-hidden="true" size={28} />
      <p className="observatory-kicker">ACCESS CONTROL</p>
      <h1>{section ? "当前角色没有这个页面的权限" : "这个账户尚未加入校务观测台"}</h1>
      <p>
        当前登录账户为 {email}。
        {section
          ? "请由所有者调整团队角色后再访问。"
          : "请由所有者在团队权限中添加该账户。"}
      </p>
      <Link href="/admin">返回校务总览</Link>
    </section>
  );
}
