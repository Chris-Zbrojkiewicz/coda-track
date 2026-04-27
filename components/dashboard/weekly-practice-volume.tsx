export type DailyPractice = {
  day: string;
  totalSeconds: number;
};

type WeeklyPracticeVolumeProps = {
  totalSeconds: number;
  sessionsCount: number;
  dailySeconds: DailyPractice[];
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function volumeLabelFromSeconds(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes < 60) {
    return { value: String(totalMinutes), unit: "min" };
  }

  const hours = totalSeconds / 3600;
  const rounded = Math.round(hours * 10) / 10;
  return {
    value: rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1),
    unit: "hrs",
  };
}

function minutesFromSeconds(totalSeconds: number) {
  return Math.max(0, Math.floor(totalSeconds / 60));
}

export function WeeklyPracticeVolume({
  totalSeconds,
  sessionsCount,
  dailySeconds,
}: WeeklyPracticeVolumeProps) {
  const minutesPerDay = Array.from({ length: 7 }, () => 0);
  // API provides dailySeconds in Monday->Sunday order, already bucketed server-side.
  for (let index = 0; index < Math.min(7, dailySeconds.length); index += 1) {
    const entry = dailySeconds[index];
    minutesPerDay[index] += minutesFromSeconds(entry.totalSeconds);
  }
  const maxMinutes = Math.max(1, ...minutesPerDay);
  const bars = DAY_LABELS.map((label, index) => {
    const minutes = minutesPerDay[index] ?? 0;
    const percent = minutes === 0 ? 0 : Math.max(8, Math.round((minutes / maxMinutes) * 100));
    return { label, minutes, percent };
  });
  const { value, unit } = volumeLabelFromSeconds(totalSeconds);

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Practice Volume
          </h2>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {sessionsCount} session{sessionsCount === 1 ? "" : "s"} this week
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold tabular-nums text-foreground md:text-4xl">{value}</div>
          <div className="text-base uppercase tracking-[0.08em] text-muted-foreground md:text-lg">
            {unit}
          </div>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-7 gap-2.5 md:gap-3">
        {bars.map((bar, index) => (
          <div key={`${bar.label}-${index}`} className="flex flex-col gap-2">
            <div
              className="relative h-36 overflow-hidden rounded-md bg-[var(--dashboard-panel-track)] md:h-40"
              role="img"
              aria-label={`${bar.minutes} minute${bar.minutes === 1 ? "" : "s"} on ${DAY_NAMES[index]}`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 border-t-2 transition-all duration-300 ease-out"
                style={{
                  height: `${bar.percent}%`,
                  borderTopColor: "var(--dashboard-accent-strong)",
                  backgroundColor: "color-mix(in oklab, var(--dashboard-accent) 34%, #0b0d10)",
                }}
                aria-hidden="true"
              />
            </div>
            <div className="text-center text-xs uppercase tracking-[0.08em] text-muted-foreground md:text-sm">
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
