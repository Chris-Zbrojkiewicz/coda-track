import { pool } from "@/lib/db";

export async function getOrCreateUserIdFromGithub(params: {
  githubId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<string> {
  const { githubId, email, name, avatarUrl } = params;

  // Create or update user atomically (safe under concurrency)
  const upserted = await pool.query<{ id: string }>(
    `insert into public.users (github_id, email, name, avatar_url)
     values ($1, $2, $3, $4)
     on conflict (github_id) do update
       set email = coalesce(excluded.email, public.users.email),
           name = coalesce(excluded.name, public.users.name),
           avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url)
     returning id`,
    [githubId, email ?? null, name ?? null, avatarUrl ?? null]
  );

  return upserted.rows[0].id;
}
