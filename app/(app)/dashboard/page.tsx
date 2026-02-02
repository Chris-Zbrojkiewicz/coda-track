import { Page, Section } from "@/components/ui/page";
import { cookies, headers } from "next/headers";

type SummaryData = {
  weekStart: string | null;
  totalSeconds: number;
  sessionsCount: number;
  streakDays: number;
};

type SessionRow = {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  note: string | null;
  status: "completed" | "partial";
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

function formatSessionDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  if (
    !summaryRes.ok ||
    !sessionsRes.ok ||
    !summaryJson?.ok ||
    !sessionsJson?.ok
  ) {
    const message =
      summaryJson?.error?.message ??
      sessionsJson?.error?.message ??
      "Unable to load dashboard data.";
    return (
      <Page title="Dashboard" description="Your practice overview for the week.">
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          {message}
        </div>
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

      <Section title="Recent sessions" right={<div className="text-xs text-muted-foreground">Last 5</div>}>
        {sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No sessions yet.</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{formatSessionDate(s.started_at)}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.status === "partial" ? "Partial" : "Completed"}
                    {s.note ? ` • ${s.note}` : ""}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {minutesFromSeconds(s.duration_seconds)} min
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Page>
  );
}
