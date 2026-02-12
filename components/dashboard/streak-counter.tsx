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
    <section className="relative h-full overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
      <div className="relative z-[1] flex items-center justify-between gap-4">
        <h2 className="m-0 text-base uppercase tracking-[0.08em] text-muted-foreground">
          Streak Counter
        </h2>
        <Zap size={44} className="text-[#46dd88]" />
      </div>

      <div className="relative z-[1] mt-10 flex items-baseline gap-3">
        <div className="tabular-nums text-[8rem] leading-none tracking-[0.03em] text-foreground">
          {pad2(safeStreak)}
        </div>
        <div className="text-2xl uppercase tracking-[0.06em] text-muted-foreground">Days</div>
      </div>

      <div
        className="relative z-[1] mt-10 h-4 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-valuetext={
          hasRecord ? `${safeStreak} of ${safeRecord} days` : `${safeStreak} day streak`
        }
      >
        <div
          className="h-full rounded-full bg-[#4dda88] transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="relative z-[1] mt-8 text-[0.95rem] tracking-[0.03em] text-muted-foreground">
        {message}
      </div>
    </section>
  );
}
