import { Zap } from "lucide-react";

type StreakCounterProps = {
  streakDays: number;
  recordDays?: number;
};

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

export function StreakCounter({ streakDays, recordDays }: StreakCounterProps) {
  const safeStreak = Math.max(0, streakDays);
  const hasRecord = typeof recordDays === "number";
  const safeRecord = Math.max(1, recordDays ?? safeStreak);
  const isNewRecord = safeStreak > safeRecord;
  const isRecordMatched = safeStreak === safeRecord;
  const daysToRecord = Math.max(0, safeRecord - safeStreak);
  const progressPercent = hasRecord
    ? Math.min(100, Math.round((safeStreak / safeRecord) * 100))
    : 0;
  const message = !hasRecord
    ? "Keep it going."
    : isNewRecord
      ? "New record!"
      : isRecordMatched
        ? "Record matched"
        : `${daysToRecord} day${daysToRecord === 1 ? "" : "s"} to beat record`;

  return (
    <section className="relative h-full rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.12em] text-muted-foreground">Streak Counter</h2>
        <Zap size={34} className="text-[var(--dashboard-accent)]" />
      </div>

      <div className="mt-8 flex items-baseline gap-3">
        <div className="tabular-nums text-[5.5rem] leading-none tracking-[0.02em] text-foreground md:text-[6.5rem]">
          {pad2(safeStreak)}
        </div>
        <div className="text-lg uppercase tracking-[0.1em] text-muted-foreground md:text-xl">Days</div>
      </div>

      <div
        className="mt-8 h-3 overflow-hidden rounded-full bg-muted/70"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-valuetext={
          hasRecord ? `${safeStreak} of ${safeRecord} days` : `${safeStreak} day streak`
        }
      >
        <div
          className="h-full rounded-full bg-[var(--dashboard-accent)] transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-6 text-sm text-muted-foreground">{message}</div>
    </section>
  );
}
