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

type UpdateRoutineBody = {
  name?: string;
  estimatedMinutes?: number;
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  const githubId = getGithubId(session);
  if (!githubId) return fail("Unauthorized", 401);

  const { id } = await params;
  if (!id) return fail("Routine ID is required", 400);

  let body: UpdateRoutineBody;
  try {
    body = (await req.json()) as UpdateRoutineBody;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  // Validate at least one field is provided
  if (!body.name && body.estimatedMinutes === undefined) {
    return fail("At least one field (name or estimatedMinutes) must be provided", 400);
  }

  // Validate name if provided
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return fail("Name cannot be empty", 400);
    if (name.length > NAME_MAX) return fail(`Name must be <= ${NAME_MAX} characters.`, 400);
  }

  // Validate estimatedMinutes if provided
  if (body.estimatedMinutes !== undefined) {
    const estimatedMinutes = Number(body.estimatedMinutes);
    if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < MIN_MINUTES)
      return fail("estimatedMinutes must be a positive integer.", 400);
    if (estimatedMinutes > MAX_MINUTES)
      return fail(`estimatedMinutes must be <= ${MAX_MINUTES}.`, 400);
  }

  try {
    const userId = await getOrCreateUserIdFromGithub({
      githubId,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      avatarUrl: session.user.image ?? null,
    });

    // First verify the routine exists and belongs to the user
    const existing = await pool.query<RoutineRow>(
      `
      select id, name, estimated_minutes, created_at
      from public.practice_routines
      where id = $1 and user_id = $2
      `,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return fail("Routine not found", 404);
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: unknown[] = [id, userId];
    let paramIndex = 2;

    if (body.name !== undefined) {
      updates.push(`name = $${++paramIndex}`);
      values.push(body.name.trim());
    }

    if (body.estimatedMinutes !== undefined) {
      updates.push(`estimated_minutes = $${++paramIndex}`);
      values.push(Number(body.estimatedMinutes));
    }

    if (updates.length === 0) {
      return fail("No fields to update", 400);
    }

    const result = await pool.query<RoutineRow>(
      `
      update public.practice_routines
      set ${updates.join(", ")}
      where id = $1 and user_id = $2
      returning id, name, estimated_minutes, created_at
      `,
      values
    );

    const row = result.rows[0];

    return ok({
      routine: {
        id: row.id,
        name: row.name,
        estimatedMinutes: row.estimated_minutes,
        createdAt: toIso(row.created_at),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return fail("Database error", 500, message);
  }
}
