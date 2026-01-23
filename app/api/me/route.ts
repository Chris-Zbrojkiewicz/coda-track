import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  // V1: return Auth.js session user for UI bootstrapping.
  return ok({
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  });
}
