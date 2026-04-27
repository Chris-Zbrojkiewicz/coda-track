import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";
import { pool } from "@/lib/db";
import { resolveUserTimeZone } from "@/lib/timezone";
import { getOrCreateUserIdFromGithub } from "@/lib/users";
import { cookies } from "next/headers";

const STREAK_LOOKBACK_DAYS = 60;
const TIME_ZONE_COOKIE = "ct_tz";

export async function GET() {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);
  const cookieStore = await cookies();
  const userTimeZone = resolveUserTimeZone(cookieStore.get(TIME_ZONE_COOKIE)?.value);

  const githubId =
    (session as any).githubId ??
    (session as any).token?.githubId ??
    (session as any).user?.githubId;

  if (!githubId) return fail("Unauthorized", 401);

  try {
    const userId = await getOrCreateUserIdFromGithub({
      githubId: String(githubId),
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      avatarUrl: session.user.image ?? null,
    });

    // 1) Weekly totals
    const weekly = await pool.query<{
      week_start: Date | string;
      total_seconds: number;
      sessions_count: number;
    }>(
      `
      select
        date_trunc('week', (now() at time zone $2)) as week_start,
        coalesce(sum(duration_seconds), 0)::int as total_seconds,
        count(*)::int as sessions_count
      from public.practice_sessions
      where user_id = $1
        and (started_at at time zone $2) >= date_trunc('week', (now() at time zone $2));
      `,
      [userId, userTimeZone]
    );

    const w = weekly.rows[0];
    const weekStart =
      w.week_start instanceof Date ? w.week_start.toISOString() : new Date(w.week_start).toISOString();
    const totalSeconds = w.total_seconds;
    const sessionsCount = w.sessions_count;

    const daily = await pool.query<{
      day: Date | string;
      total_seconds: number;
    }>(
      `
      with week_days as (
        select (date_trunc('week', (now() at time zone $2))::date + gs)::date as day
        from generate_series(0, 6) as gs
      ),
      practice_totals as (
        select
          (started_at at time zone $2)::date as day,
          coalesce(sum(duration_seconds), 0)::int as total_seconds
        from public.practice_sessions
        where user_id = $1
          and (started_at at time zone $2) >= date_trunc('week', (now() at time zone $2))
          and (started_at at time zone $2) < date_trunc('week', (now() at time zone $2)) + interval '7 day'
        group by 1
      )
      select
        wd.day,
        coalesce(pt.total_seconds, 0)::int as total_seconds
      from week_days wd
      left join practice_totals pt using (day)
      order by wd.day asc;
      `,
      [userId, userTimeZone]
    );
    const dailySeconds = daily.rows.map((row) => ({
      day: row.day instanceof Date ? row.day.toISOString() : new Date(row.day).toISOString(),
      totalSeconds: row.total_seconds,
    }));

    // 2) Streak calculation (user-local day-bucketing, consecutive from today backwards)
    const streakRes = await pool.query<{ streak_days: number }>(
      `
      with days as (
        select ((now() at time zone $3)::date - gs)::date as day
        from generate_series(0, $2::int) as gs
      ),
      has_session as (
        select (started_at at time zone $3)::date as day
        from public.practice_sessions
        where user_id = $1
        group by 1
      ),
      timeline as (
        select
          d.day,
          (h.day is not null) as practiced
        from days d
        left join has_session h using (day)
        order by d.day desc
      ),
      breaks as (
        select
          day,
          practiced,
          sum(case when practiced = false then 1 else 0 end) over (order by day desc) as break_group
        from timeline
      )
      select count(*)::int as streak_days
      from breaks
      where break_group = 0
        and practiced = true;
      `,
      [userId, STREAK_LOOKBACK_DAYS, userTimeZone]
    );
    const streakDays = streakRes.rows[0]?.streak_days ?? 0;

    return ok({
      weekStart,
      totalSeconds,
      sessionsCount,
      streakDays,
      // dailySeconds is always 7 entries, Mon..Sun in the user's local timezone.
      dailySeconds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return fail("Database error", 500, message);
  }
}
