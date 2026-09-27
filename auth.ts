import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { fetchRole } from "@/lib/session-role";

const API_URL = process.env.API_URL || "http://localhost:3000";

class AccountDisabledError extends CredentialsSignin {
  code = "account_disabled";
}

/** A new owner account still waiting for review (REQUIRE_ACCOUNT_APPROVAL). */
class AccountPendingError extends CredentialsSignin {
  code = "account_pending";
}

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // The sign-in page's Owner / Staff choice; the backend refuses the
        // other kind of account like a wrong password.
        signInAs: { label: "Sign in as", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;
        const signInAs = credentials?.signInAs === "staff" ? "staff" : "owner";

        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, signInAs }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body?.error === "ACCOUNT_DISABLED") throw new AccountDisabledError();
          if (body?.error === "ACCOUNT_PENDING_APPROVAL") throw new AccountPendingError();
          return null;
        }

        const data = await res.json();
        if (!data?.user) return null;

        return {
          id: data.user.id ?? data.user.email,
          name: data.user.name ?? data.user.email,
          email: data.user.email,
          image: data.user.image ?? null,
          accessToken: data.token,
          role: data.user.role ?? null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user && "accessToken" in user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      if (user && "role" in user) {
        token.role = (user as { role?: string | null }).role;
      }
      // A session update (e.g. right after creating a business) re-reads the
      // role from the backend. Whatever the caller passed is ignored, so a
      // client can't promote itself to OWNER.
      if (trigger === "update" && typeof token.accessToken === "string") {
        const role = await fetchRole(token.accessToken);
        if (role !== undefined) token.role = role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.accessToken) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      if ("role" in token) {
        (session as { role?: string | null }).role = token.role as string | null;
      }
      return session;
    },
  },
});
