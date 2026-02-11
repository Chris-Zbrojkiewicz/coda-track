import { Page, Section } from "@/components/ui/page";
import { cookies, headers } from "next/headers";
import { InlineError } from "@/components/ui/inline-error";
import { RecentSessions, type SessionRow } from "@/components/dashboard/recent-sessions";

type SummaryData = {
  weekStart: string | null;
  totalSeconds: number;
  sessionsCount: number;
  streakDays: number;
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

function minutesFromSeconds(seconds: number) {
  return Math.round(seconds / 60);
}

export default async function DashboardPage() {
  const baseUrl = await getBaseUrl();
  const cookieHeader = (await cookies()).toString();
  const fetchInit: RequestInit = {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  };

  const [summaryRes, sessionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/summary`, fetchInit),
    fetch(`${baseUrl}/api/sessions?limit=5`, fetchInit),
  ]);

  const summaryJson = await summaryRes.json().catch(() => null);
  const sessionsJson = await sessionsRes.json().catch(() => null);

  if (!summaryRes.ok || !sessionsRes.ok || !summaryJson?.ok || !sessionsJson?.ok) {
    const message =
      summaryJson?.error?.message ??
      sessionsJson?.error?.message ??
      "Unable to load dashboard data.";
    return (
      <Page title="Dashboard" description="Your practice overview for the week.">
        <InlineError message={message} retryHref="/dashboard" />
      </Page>
    );
  }

  const summary: SummaryData = summaryJson.data;
  const sessions: SessionRow[] = sessionsJson.data.sessions ?? [];
  const totalMinutes = minutesFromSeconds(summary.totalSeconds ?? 0);

  return (
    <Page
      title="Dashboard"
      description="Your practice overview for the week."
      right={<div className="text-sm text-muted-foreground">Schedule</div>}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <Section title="Total practice time">
          <div className="text-3xl font-semibold">{totalMinutes} min</div>
          <div className="mt-2 text-sm text-muted-foreground">This week</div>
        </Section>
        <Section title="Sessions">
          <div className="text-3xl font-semibold">{summary.sessionsCount ?? 0}</div>
          <div className="mt-2 text-sm text-muted-foreground">This week</div>
        </Section>
        <Section title="Streak">
          <div className="text-3xl font-semibold">{summary.streakDays ?? 0}</div>
          <div className="mt-2 text-sm text-muted-foreground">Days</div>
        </Section>
      </div>

      <RecentSessions sessions={sessions} />
    </Page>
  );
}
