import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getRepository } from "@/lib/repositories";
import { runtimeEnv } from "@/lib/server/env";
import { verifyPassword } from "@/lib/security/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: runtimeEnv().AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await getRepository().findUserByEmail(email);
        if (
          !user ||
          !(await verifyPassword(
            password,
            user.passwordHash,
            user.passwordSalt,
          ))
        ) {
          return null;
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
