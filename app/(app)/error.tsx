"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-lg font-semibold">Something went wrong</div>
        <div className="mt-2 text-sm text-muted-foreground">
          {error.message || "Unexpected error."}
        </div>
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center rounded-xl border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
