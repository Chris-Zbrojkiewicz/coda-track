import Link from "next/link";
import { CirclePlay, PencilLine, ListMusic } from "lucide-react";

type UpNextPracticeCardProps = {
  routineName: string;
  estimatedMinutes: number;
  startHref?: string;
  editHref?: string;
};

export function UpNextPracticeCard({
  routineName,
  estimatedMinutes,
  startHref = "/practice/session",
  editHref = "/practice/setup",
}: UpNextPracticeCardProps) {
  return (
    <section className="h-full rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-[var(--dashboard-accent)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-black md:text-sm">
            Up Next
          </span>
          <div className="text-xl font-semibold tracking-tight md:text-2xl">Ready to Practice?</div>
          <div className="flex items-center gap-2 text-base text-muted-foreground md:text-lg">
            <ListMusic size={18} className="text-muted-foreground md:size-5" />
            <span>Routine:</span>
            <span className="font-semibold text-foreground">{routineName}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground md:text-sm">
            Est. Time
          </div>
          <div className="mt-1.5 leading-none">
            <span className="text-5xl font-semibold text-[var(--dashboard-accent-strong)] md:text-6xl">
              {estimatedMinutes}
            </span>
            <span className="ml-1 text-2xl font-semibold text-[var(--dashboard-accent)] md:text-3xl">
              m
            </span>
          </div>
        </div>
      </div>

      <div className="my-6 h-px bg-border/60" />

      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <Link
          href={startHref}
          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-3xl bg-[var(--dashboard-accent)] px-5 text-lg font-semibold uppercase tracking-[0.1em] text-black transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--dashboard-accent-strong)] md:min-h-16 md:text-xl"
        >
          <CirclePlay size={24} />
          Start Session
        </Link>
        <Link
          href={editHref}
          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-3xl border border-border px-5 text-md font-semibold text-foreground transition-colors hover:bg-muted md:min-h-16 md:text-lg"
        >
          <PencilLine size={22} className="text-[var(--dashboard-accent)]" />
          Edit Routine
        </Link>
      </div>
    </section>
  );
}
