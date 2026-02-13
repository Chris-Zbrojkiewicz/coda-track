import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";
import { pool } from "@/lib/db";
import { getOrCreateUserIdFromGithub } from "@/lib/users";

const MIN_SESSION_SECONDS = 10;
const MAX_SESSION_SECONDS = 8 * 60 * 60;
const DURATION_TOLERANCE_SECONDS = 5;

type CreateSessionBody = {
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  clientSessionId: string; // uuid
  note?: string | null;
  status?: "completed" | "partial";
};

function isIsoDateString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
  return isoPattern.test(v) && !Number.isNaN(Date.parse(v));
}

function isUuidString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(v);
}

function isPgUniqueViolation(
  err: unknown,
  constraint: string
): err is { code: "23505"; constraint?: string } {
  if (!err || typeof err !== "object") return false;
  const candidate = err as { code?: string; constraint?: string };
  return candidate.code === "23505" && candidate.constraint === constraint;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  // auth() exposes jwt callback fields server-side
  const githubId =
    (session as any).githubId ??
    (session as any).token?.githubId ??
    (session as any).user?.githubId;

  if (!githubId) return fail("Missing GitHub id in session", 500);

  let body: CreateSessionBody;
  try {
    body = (await req.json()) as CreateSessionBody;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  // Validation
  const { startedAt, endedAt, durationSeconds, clientSessionId, note, status } = body;

  if (!isIsoDateString(startedAt)) return fail("startedAt must be ISO date", 400);
  if (!isIsoDateString(endedAt)) return fail("endedAt must be ISO date", 400);
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds))
    return fail("durationSeconds must be a finite number", 400);
  if (durationSeconds < MIN_SESSION_SECONDS)
    return fail("Session too short (minimum is 10 seconds).", 400);
  if (durationSeconds > MAX_SESSION_SECONDS)
    return fail("Session duration exceeds maximum allowed length.", 400);
  if (!isUuidString(clientSessionId)) return fail("clientSessionId must be a valid UUID", 400);

  const s = new Date(startedAt);
  const e = new Date(endedAt);
  if (e < s) return fail("endedAt must be >= startedAt", 400);
  const actualSeconds = Math.floor((e.getTime() - s.getTime()) / 1000);
  if (Math.abs(actualSeconds - durationSeconds) > DURATION_TOLERANCE_SECONDS)
    return fail("Duration mismatch.", 400);

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
      (user_id, started_at, ended_at, duration_seconds, client_session_id, note, status)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, user_id, started_at, ended_at, duration_seconds, client_session_id, note, status`,
      [
        userId,
        s,
        e,
        durationSeconds,
        clientSessionId,
        note ?? null,
        safeStatus,
      ]
    );

    return ok({ session: inserted.rows[0] }, { status: 201 });
  } catch (err) {
    if (isPgUniqueViolation(err, "ux_practice_sessions_client_session_id")) {
      return fail("Session already saved.", 409);
    }
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

  if (!githubId) return fail("Missing GitHub id in session", 500);

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
