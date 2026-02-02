import Link from "next/link";

export function InlineError(props: { message: string; retryHref?: string }) {
  const { message, retryHref } = props;

  return (
    <div className="rounded-2xl border bg-card p-6 text-sm">
      <div className="font-medium">Something went wrong</div>
      <div className="mt-1 text-muted-foreground">{message}</div>

      {retryHref ? (
        <div className="mt-4">
          <Link
            href={retryHref}
            className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Retry
          </Link>
        </div>
      ) : null}
    </div>
  );
}
