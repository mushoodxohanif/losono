import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ensureFreeSubscription } from "@/lib/billing/subscriptions";
import { getDb } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";

if (
  !env.AUTH_SECRET &&
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  throw new Error(
    "AUTH_SECRET is required. Generate one with: openssl rand -base64 32",
  );
}

function buildProviders() {
  const providers = [];

  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
    );
  }

  return providers;
}

function getAuthSecret(): string {
  if (env.AUTH_SECRET) {
    return env.AUTH_SECRET;
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-auth-secret-placeholder";
  }

  throw new Error("Missing required environment variable: AUTH_SECRET");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: buildProviders(),
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: getAuthSecret(),
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.id) {
        return true;
      }

      // signIn runs before adapter persistence for new OAuth users.
      const [existingUser] = await getDb()
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (existingUser) {
        await ensureFreeSubscription(user.id);
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureFreeSubscription(user.id);
      }
    },
  },
});
