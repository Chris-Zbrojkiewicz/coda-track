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

function dayIndexFromIso(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return -1;
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function WeeklyPracticeVolume({
  totalSeconds,
  sessionsCount,
  dailySeconds,
}: WeeklyPracticeVolumeProps) {
  const minutesPerDay = Array.from({ length: 7 }, () => 0);
  for (const entry of dailySeconds) {
    const index = dayIndexFromIso(entry.day);
    if (index >= 0 && index < 7) {
      minutesPerDay[index] += minutesFromSeconds(entry.totalSeconds);
    }
  }
  const maxMinutes = Math.max(1, ...minutesPerDay);
  const bars = DAY_LABELS.map((label, index) => {
    const minutes = minutesPerDay[index] ?? 0;
    const percent = minutes === 0 ? 0 : Math.max(8, Math.round((minutes / maxMinutes) * 100));
    return { label, minutes, percent };
  });
  const { value, unit } = volumeLabelFromSeconds(totalSeconds);

  return (
    <section className="rounded-3xl border border-border bg-card p-6 md:col-span-2 md:p-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Practice Volume
          </h2>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {sessionsCount} session{sessionsCount === 1 ? "" : "s"} this week
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-semibold tabular-nums text-foreground">{value}</div>
          <div className="text-lg uppercase tracking-[0.08em] text-muted-foreground">{unit}</div>
        </div>
      </header>

      <div className="mt-7 grid grid-cols-7 gap-3 md:gap-4">
        {bars.map((bar, index) => (
          <div key={`${bar.label}-${index}`} className="flex flex-col gap-3">
            <div
              className="relative h-44 overflow-hidden rounded-md bg-[var(--dashboard-panel-track)]"
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
            <div className="text-center text-sm uppercase tracking-[0.08em] text-muted-foreground">
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
