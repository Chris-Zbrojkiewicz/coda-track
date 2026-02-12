import { Page, Section } from "@/components/ui/page";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { InlineError } from "@/components/ui/inline-error";
import { RecentSessions, type SessionRow } from "@/components/dashboard/recent-sessions";
import { StreakCounter } from "@/components/dashboard/streak-counter";

type SummaryData = {
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
  return Math.floor(seconds / 60);
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

  const summary = (summaryJson?.data ?? {}) as SummaryData;
  const sessions: SessionRow[] = sessionsJson?.data?.sessions ?? [];
  const totalSeconds = summary.totalSeconds ?? 0;
  const totalMinutes = minutesFromSeconds(totalSeconds);
  const totalLabel = totalMinutes === 0 && totalSeconds > 0 ? "<1" : String(totalMinutes);

  return (
    <Page
      title="Dashboard"
      description="Your practice overview for the week."
      right={
        <Link
          href="/practice/session"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
        >
          Start practice
        </Link>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <Section title="Total practice time">
          <div className="text-3xl font-semibold">{totalLabel} min</div>
          <div className="mt-2 text-sm text-muted-foreground">This week</div>
        </Section>
        <Section title="Sessions">
          <div className="text-3xl font-semibold">{summary.sessionsCount ?? 0}</div>
          <div className="mt-2 text-sm text-muted-foreground">This week</div>
        </Section>
        <StreakCounter streakDays={summary.streakDays ?? 0} />
      </div>

      <RecentSessions sessions={sessions} />
    </Page>
  );
}
