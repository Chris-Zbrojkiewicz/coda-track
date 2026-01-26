import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";
import { pool } from "@/lib/db";
import { getOrCreateUserIdFromGithub } from "@/lib/users";

type CreateSessionBody = {
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  note?: string | null;
  status?: "completed" | "partial";
};

function isIsoDateString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const isoPattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
  return isoPattern.test(v) && !Number.isNaN(Date.parse(v));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  // auth() exposes jwt callback fields server-side
  const githubId =
    (session as any).githubId ??
    (session as any).token?.githubId ??
    (session as any).user?.githubId;

  if (!githubId) return fail("Missing GitHub id in session", 401);

  let body: CreateSessionBody;
  try {
    body = (await req.json()) as CreateSessionBody;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  // Validation
  const { startedAt, endedAt, durationSeconds, note, status } = body;

  if (!isIsoDateString(startedAt)) return fail("startedAt must be ISO date", 400);
  if (!isIsoDateString(endedAt)) return fail("endedAt must be ISO date", 400);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0)
    return fail("durationSeconds must be a non-negative number", 400);

  const s = new Date(startedAt);
  const e = new Date(endedAt);
  if (e < s) return fail("endedAt must be >= startedAt", 400);

  const safeStatus = status ?? "completed";
  if (safeStatus !== "completed" && safeStatus !== "partial")
    return fail("status must be 'completed' or 'partial'", 400);

  try {
    // 1) Ensure local user exists
    const userId = await getOrCreateUserIdFromGithub({
      githubId: String(githubId),
      email: session.user?.email ?? null,
      name: session.user?.name ?? null,
      avatarUrl: session.user?.image ?? null,
    });

    // 2) Insert practice session
    const inserted = await pool.query(
      `insert into public.practice_sessions
      (user_id, started_at, ended_at, duration_seconds, note, status)
     values ($1, $2, $3, $4, $5, $6)
     returning id, user_id, started_at, ended_at, duration_seconds, note, status`,
      [userId, s.toISOString(), e.toISOString(), durationSeconds, note ?? null, safeStatus]
    );

    return ok({ session: inserted.rows[0] }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return fail("Database error", 500, message);
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  const githubId =
    (session as any).githubId ??
    (session as any).token?.githubId ??
    (session as any).user?.githubId;

  if (!githubId) return fail("Missing GitHub id in session", 401);

  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  let limit = 20;
  if (limitParam !== null) {
    const parsed = Number(limitParam);
    if (!Number.isInteger(parsed) || parsed <= 0)
      return fail("limit must be a positive integer", 400);
    limit = Math.min(parsed, 100);
  }

  try {
    const userId = await getOrCreateUserIdFromGithub({
      githubId: String(githubId),
      email: session.user?.email ?? null,
      name: session.user?.name ?? null,
      avatarUrl: session.user?.image ?? null,
    });

    const rows = await pool.query(
      `select id, user_id, started_at, ended_at, duration_seconds, note, status
       from public.practice_sessions
       where user_id = $1
       order by started_at desc
       limit $2`,
      [userId, limit]
    );

    return ok({ sessions: rows.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return fail("Database error", 500, message);
  }
}
