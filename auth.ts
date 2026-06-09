import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/src/db/prisma";
import { normalizeEmail, verifyPassword } from "@/src/server/auth/password";
import { normalizeStaffUsername } from "@/src/server/admin-permissions";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials?.email === "string"
            ? credentials.email.trim()
            : "";
        const email = identifier.includes("@")
          ? normalizeEmail(identifier)
          : "";
        const username = identifier.includes("@")
          ? ""
          : normalizeStaffUsername(identifier);
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if ((!email && !username) || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: email ? { email } : { username },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            passwordHash: true,
            role: true,
            twoFactorEnabled: true,
            disabledAt: true,
          },
        });

        if (!user?.passwordHash || user.disabledAt) {
          return null;
        }

        const passwordMatches = await verifyPassword(
          password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        token.twoFactorRequired = Boolean(user.twoFactorEnabled);
        token.twoFactorVerified = !user.twoFactorEnabled;
        token.twoFactorVerifiedAt = user.twoFactorEnabled
          ? undefined
          : Math.floor(Date.now() / 1000);
      }

      if (
        trigger === "update" &&
        session?.user?.twoFactorVerified === true &&
        token.role === "ADMIN"
      ) {
        token.twoFactorRequired = true;
        token.twoFactorVerified = true;
        token.twoFactorVerifiedAt = Math.floor(Date.now() / 1000);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.twoFactorVerified = token.twoFactorVerified;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth(authConfig);
