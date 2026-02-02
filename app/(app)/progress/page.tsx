import { Page, Section } from "@/components/ui/page";
import { cookies, headers } from "next/headers";
import { formatShortDate } from "@/lib/date";

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

function toDateKey(d: Date) {
  // YYYY-MM-DD in UTC
  return d.toISOString().slice(0, 10);
}

function lastNDaysKeys(n: number) {
  const keys: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // oldest -> newest
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(toDateKey(d));
  }

  return keys;
}

function aggregateDailyMinutes(sessions: SessionRow[], dayKeys: string[]) {
  const totals = new Map<string, number>();
  for (const k of dayKeys) totals.set(k, 0);

  for (const s of sessions) {
    const key = toDateKey(new Date(s.started_at));
    if (!totals.has(key)) continue;

    const minutes = Math.round(s.duration_seconds / 60);
    totals.set(key, (totals.get(key) ?? 0) + minutes);
  }

  return dayKeys.map((k) => ({ date: k, minutes: totals.get(k) ?? 0 }));
}

export default async function ProgressPage() {
  const baseUrl = await getBaseUrl();
  const cookieHeader = (await cookies()).toString();

  const fetchInit: RequestInit = {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  };

  const sessionsRes = await fetch(`${baseUrl}/api/sessions?limit=200`, fetchInit);
  const sessionsJson = await sessionsRes.json().catch(() => null);

  if (!sessionsRes.ok || !sessionsJson?.ok) {
    const message = sessionsJson?.error?.message ?? "Unable to load progress data.";
    return (
      <Page title="Progress" description="Your practice over time.">
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          {message}
        </div>
      </Page>
    );
  }

  const sessions: SessionRow[] = sessionsJson.data.sessions ?? [];

  if (sessions.length === 0) {
    return (
      <Page title="Progress" description="Your practice over time.">
        <Section title="Last 14 days">
          <div className="text-sm text-muted-foreground">
            No practice sessions yet. Log your first session to unlock your progress chart.
          </div>
        </Section>
      </Page>
    );
  }

  const dayKeys = lastNDaysKeys(14);
  const daily = aggregateDailyMinutes(sessions, dayKeys);
  const max = Math.max(...daily.map((d) => d.minutes), 1);

  return (
    <Page title="Progress" description="Your practice over time.">
      <Section
        title="Last 14 days"
        right={<div className="text-xs text-muted-foreground">Minutes</div>}
      >
        <div className="space-y-2">
          {daily.map((d) => (
            <div key={d.date} className="flex items-center gap-3 text-sm">
              <div className="w-24 text-xs text-muted-foreground">{formatShortDate(d.date)}</div>

              <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                <div
                  className="h-2 bg-foreground/70"
                  style={{ width: `${Math.round((d.minutes / max) * 100)}%` }}
                />
              </div>

              <div className="w-12 text-right text-xs text-muted-foreground">{d.minutes}m</div>
            </div>
          ))}
        </div>
      </Section>
    </Page>
  );
}
