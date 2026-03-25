import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ensureUser } from "@/lib/credits";
import { getPool, ensureTable } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis.");
        }

        await ensureTable();
        const db = getPool();

        const result = await db.query(
          `SELECT id, email, name, image, password_hash FROM users WHERE email = $1`,
          [credentials.email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
          throw new Error("Aucun compte trouvé avec cet email.");
        }

        const user = result.rows[0];

        if (!user.password_hash) {
          throw new Error("Ce compte utilise Google. Connectez-vous avec Google.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) {
          throw new Error("Mot de passe incorrect.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin", // Not used — we handle auth via modal, but prevents NextAuth default page
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "production" ? undefined : "dev-secret-change-me"),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // For credentials provider, user already exists in DB
      if (account?.provider === "credentials") {
        return true;
      }

      // For Google, generate stable user ID
      const userId =
        account?.provider && account?.providerAccountId
          ? `${account.provider}_${account.providerAccountId}`
          : user.id;

      await ensureUser({
        id: userId,
        email: user.email,
        name: user.name,
        image: user.image,
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        if (account.provider === "credentials") {
          // Credentials: user.id is already the stable DB id
          token.userId = user.id;
        } else {
          // OAuth: generate stable ID from provider
          token.userId =
            account.provider && account.providerAccountId
              ? `${account.provider}_${account.providerAccountId}`
              : user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
};

// ─── Type augmentation for next-auth ────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
