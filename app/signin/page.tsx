import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl ?? "/dashboard")}`);
}
