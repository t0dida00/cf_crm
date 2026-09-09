import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_URL = process.env.API_URL || "http://localhost:3000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "google",
      name: "Google",
      credentials: {},
      authorize: async () => ({
        id: "demo-user",
        name: "Demo User",
        email: "demo.user@gmail.com",
        image: null,
      }),
    }),
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) return null;

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
    jwt({ token, user }) {
      if (user && "accessToken" in user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      if (user && "role" in user) {
        token.role = (user as { role?: string | null }).role;
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
