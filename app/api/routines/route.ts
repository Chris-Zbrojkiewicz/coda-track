import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";
import { pool } from "@/lib/db";
import { getOrCreateUserIdFromGithub } from "@/lib/users";

type RoutineRow = {
  id: string;
  name: string;
  estimated_minutes: number;
  created_at: string | Date;
};

type CreateRoutineBody = {
  name: string;
  estimatedMinutes: number;
};

function getGithubId(session: unknown): string | null {
  const s = session as any;
  const gh = s?.githubId ?? s?.token?.githubId ?? s?.user?.githubId;

  return gh != null ? String(gh) : null;
}

function toIso(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const NAME_MAX = 80;
const MIN_MINUTES = 1;
const MAX_MINUTES = 600;

export async function GET() {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  const githubId = getGithubId(session);
  if (!githubId) return fail("Unauthorized", 401);

  try {
    const userId = await getOrCreateUserIdFromGithub({
      githubId,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      avatarUrl: session.user.image ?? null,
    });

    const result = await pool.query<RoutineRow>(
      `
      select id, name, estimated_minutes, created_at
      from public.practice_routines
      where user_id = $1
      order by created_at desc
      `,
      [userId]
    );

    const routines = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      estimatedMinutes: row.estimated_minutes,
      createdAt: toIso(row.created_at),
    }));

    return ok({ routines });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return fail("Database error", 500, message);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  const githubId = getGithubId(session);
  if (!githubId) return fail("Unauthorized", 401);

  let body: CreateRoutineBody;
  try {
    body = (await req.json()) as CreateRoutineBody;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const estimatedMinutes = Number(body.estimatedMinutes);

  if (!name) return fail("Name is required.", 400);
  if (name.length > NAME_MAX) return fail(`Name must be <= ${NAME_MAX} characters.`, 400);

  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < MIN_MINUTES)
    return fail("estimatedMinutes must be a positive integer.", 400);
  if (estimatedMinutes > MAX_MINUTES)
    return fail(`estimatedMinutes must be <= ${MAX_MINUTES}.`, 400);

  try {
    const userId = await getOrCreateUserIdFromGithub({
      githubId,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      avatarUrl: session.user.image ?? null,
    });

    const inserted = await pool.query<RoutineRow>(
      `
      insert into public.practice_routines (user_id, name, estimated_minutes)
      values ($1, $2, $3)
      returning id, name, estimated_minutes, created_at
      `,
      [userId, name, estimatedMinutes]
    );

    const row = inserted.rows[0];

    return ok(
      {
        routine: {
          id: row.id,
          name: row.name,
          estimatedMinutes: row.estimated_minutes,
          createdAt: toIso(row.created_at),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return fail("Database error", 500, message);
  }
}
