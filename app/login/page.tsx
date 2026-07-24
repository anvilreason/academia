import Link from "next/link";
import { AuthForm } from "@/components/features/auth/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; continue?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="auth-page">
      <header className="simple-header">
        <Link className="wordmark" href="/">
          Academia
        </Link>
        <Link className="text-link" href="/">
          返回首页
        </Link>
      </header>
      <AuthForm
        continueTo={query.continue}
        initialMode={query.mode === "register" ? "register" : "login"}
      />
    </main>
  );
}
