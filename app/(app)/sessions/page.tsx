import { cookies, headers } from "next/headers";
import { Page } from "@/components/ui/page";
import { InlineError } from "@/components/ui/inline-error";
import { RecentSessions, type SessionRow } from "@/components/dashboard/recent-sessions";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export default async function SessionsPage() {
  const baseUrl = await getBaseUrl();
  const cookieHeader = (await cookies()).toString();
  const fetchInit: RequestInit = {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  };

  const sessionsRes = await fetch(`${baseUrl}/api/sessions?limit=100`, fetchInit);
  const sessionsJson = await sessionsRes.json().catch(() => null);

  if (!sessionsRes.ok || !sessionsJson?.ok) {
    const message = sessionsJson?.error?.message ?? "Unable to load sessions.";
    return (
      <Page title="Sessions" description="Your full session history.">
        <InlineError message={message} retryHref="/sessions" />
      </Page>
    );
  }

  const sessions: SessionRow[] = sessionsJson.data.sessions ?? [];

  return (
    <Page title="Sessions" description="Your full session history.">
      <RecentSessions sessions={sessions} showHeader={false} showViewAll={false} />
    </Page>
  );
}
