import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const requiredEnv = ["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET", "AUTH_SECRET"] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const { handlers, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const ghId = (profile as any).id;
        if (ghId != null) token.githubId = String(ghId);
      }
      return token;
    },
    async session({ session, token }) {
      // Make githubId available to server routes via auth()
      (session as any).githubId = (token as any).githubId ?? null;
      return session;
    },
  },
});
