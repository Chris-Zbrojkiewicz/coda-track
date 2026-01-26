import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";
import { pool } from "@/lib/db";
import { getOrCreateUserIdFromGithub } from "@/lib/users";

function toDateKey(d: Date) {
  // YYYY-MM-DD in UTC
  return d.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  const githubId =
    (session as any).githubId ??
    (session as any).token?.githubId ??
    (session as any).user?.githubId;

  if (!githubId) return fail("Missing GitHub id in session", 500);

  try {
    const userId = await getOrCreateUserIdFromGithub({
      githubId: String(githubId),
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      avatarUrl: session.user.image ?? null,
    });

    // 1) Weekly totals
    const weekly = await pool.query<{
      week_start: string;
      today: string; // YYYY-MM-DD
      total_seconds: number;
      sessions_count: number;
    }>(
      `
      select
        date_trunc('week', now()) as week_start,
        current_date::text as today,
        coalesce(sum(duration_seconds), 0)::int as total_seconds,
        count(*)::int as sessions_count
      from public.practice_sessions
      where user_id = $1
        and started_at >= date_trunc('week', now());
      `,
      [userId]
    );

    const w = weekly.rows[0];
    const weekStart = w.week_start;
    const totalSeconds = w.total_seconds;
    const sessionsCount = w.sessions_count;

    // 2) Streak calculation (V1)
    // Definition: consecutive days INCLUDING today where user has >= 1 session.
    // If the user didn't practice today, streak = 0.
    const daysRes = await pool.query<{ d: string }>(
      `
      select distinct (started_at at time zone 'utc')::date as d
      from public.practice_sessions
      where user_id = $1
        and started_at >= (current_date - interval '90 days')
      order by d desc;
      `,
      [userId]
    );

    const practicedDays = new Set(daysRes.rows.map((r) => r.d)); // YYYY-MM-DD
    const todayUtc = new Date(`${w.today}T00:00:00.000Z`);

    let streakDays = 0;
    for (let i = 0; i < 365; i++) {
      const key = toDateKey(addDaysUtc(todayUtc, -i));
      if (!practicedDays.has(key)) break;
      streakDays++;
    }

    return ok({
      weekStart,
      totalSeconds,
      sessionsCount,
      streakDays,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return fail("Database error", 500, message);
  }
}
