import { Page } from "@/components/ui/page";
import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { InlineError } from "@/components/ui/inline-error";
import { RecentSessions, type SessionRow } from "@/components/dashboard/recent-sessions";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import {
  WeeklyPracticeVolume,
  type DailyPractice,
} from "@/components/dashboard/weekly-practice-volume";
import { UpNextPracticeCard } from "@/components/dashboard/up-next-practice-card";

type SummaryData = {
  totalSeconds: number;
  sessionsCount: number;
  streakDays: number;
  dailySeconds: DailyPractice[];
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export default async function DashboardPage() {
  const session = await auth();
  const welcomeName = session?.user?.name?.trim() || "there";
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
      <Page title={`Welcome, ${welcomeName}`} description="Your practice overview for the week.">
        <InlineError message={message} retryHref="/dashboard" />
      </Page>
    );
  }

  const summary = (summaryJson?.data ?? {}) as SummaryData;
  const sessions: SessionRow[] = sessionsJson?.data?.sessions ?? [];

  return (
    <Page title={`Welcome, ${welcomeName}`} description="Let’s build momentum.">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-full md:col-span-2">
          <UpNextPracticeCard />
        </div>
        <StreakCounter streakDays={summary.streakDays ?? 0} />

        <div className="md:col-span-3">
          <WeeklyPracticeVolume
            totalSeconds={summary.totalSeconds ?? 0}
            sessionsCount={summary.sessionsCount ?? 0}
            dailySeconds={summary.dailySeconds ?? []}
          />
        </div>

        <div className="md:col-span-3">
          <RecentSessions sessions={sessions} />
        </div>
      </div>
    </Page>
  );
}
