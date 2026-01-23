import { auth } from "@/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  // TODO (Issue #14): fetch sessions from DB
  return ok({
    sessions: [],
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  // TODO (Issue #12): validate and insert into DB
  // For now, echo back with a placeholder id so the UI can be wired.
  return ok(
    {
      session: {
        id: "placeholder",
        ...(body as object),
      },
    },
    { status: 201 }
  );
}
