import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const githubId = process.env.AUTH_GITHUB_ID;
const githubSecret = process.env.AUTH_GITHUB_SECRET;

if ((githubId && !githubSecret) || (!githubId && githubSecret)) {
  throw new Error(
    "GitHub auth config is incomplete. Set both AUTH_GITHUB_ID and AUTH_GITHUB_SECRET."
  );
}

const providers =
  githubId && githubSecret
    ? [
        GitHub({
          clientId: githubId,
          clientSecret: githubSecret,
        }),
      ]
    : [];

export const { handlers, auth } = NextAuth({
  providers,
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
