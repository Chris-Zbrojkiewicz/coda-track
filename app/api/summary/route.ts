import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  // TODO (Issue #15): compute real weekly summary from DB
  return ok({
    weekStart: null,
    totalSeconds: 0,
    sessionsCount: 0,
    streakDays: 0,
  });
}
