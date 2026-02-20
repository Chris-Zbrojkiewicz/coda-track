"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CirclePlay, PencilLine, ListMusic } from "lucide-react";

type Routine = {
  id: string;
  name: string;
  estimatedMinutes: number;
  createdAt: string;
};

type UpNextPracticeCardProps = {
  initialRoutineId?: string;
  startHref?: string;
  editHref?: string;
};

const STORAGE_KEY = "ct:selectedRoutineId";

export function UpNextPracticeCard({
  initialRoutineId,
  startHref = "/practice/session",
  editHref = "/practice/setup",
}: UpNextPracticeCardProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive selectedRoutine from selectedRoutineId + routines to avoid state drift
  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId) ?? null;

  useEffect(() => {
    async function fetchRoutines() {
      try {
        setError(null);
        const response = await fetch("/api/routines", { cache: "no-store" });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.ok) {
          setError(data?.error?.message ?? "Unable to load routines.");
          return;
        }

        const fetched = (data.data?.routines ?? []) as Routine[];
        setRoutines(fetched);

        if (fetched.length > 0) {
          // Priority: initialRoutineId prop > localStorage > first routine
          const storedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
          const idToUse = initialRoutineId || storedId || fetched[0].id;
          
          // Validate the ID exists in fetched routines
          const validId = fetched.find((r) => r.id === idToUse)?.id || fetched[0].id;
          setSelectedRoutineId(validId);
          
          // Persist to localStorage if not already set
          if (typeof window !== "undefined" && validId !== storedId) {
            localStorage.setItem(STORAGE_KEY, validId);
          }
        }
      } catch {
        setError("Unable to load routines.");
      } finally {
        setLoading(false);
      }
    }

    fetchRoutines();
  }, [initialRoutineId]);

  const handleRoutineChange = (routineId: string) => {
    setSelectedRoutineId(routineId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, routineId);
    }
  };

  const displayName = selectedRoutine?.name || "No routine selected";
  const displayMinutes = selectedRoutine?.estimatedMinutes ?? 0;
  const startSessionHref = selectedRoutine
    ? `${startHref}?routineId=${encodeURIComponent(
        selectedRoutine.id
      )}&routineName=${encodeURIComponent(
        selectedRoutine.name
      )}&estimatedMinutes=${encodeURIComponent(String(selectedRoutine.estimatedMinutes))}`
    : startHref;

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
            <label htmlFor="routine-select" className="sr-only">
              Select practice routine
            </label>
            {loading ? (
              <span className="font-semibold text-foreground">Loading...</span>
            ) : error ? (
              <span className="font-semibold text-muted-foreground text-sm">{error}</span>
            ) : routines.length > 0 ? (
              <select
                id="routine-select"
                value={selectedRoutineId}
                onChange={(e) => handleRoutineChange(e.target.value)}
                className="font-semibold text-foreground bg-transparent border-none outline-none cursor-pointer focus:ring-2 focus:ring-[var(--dashboard-accent)] rounded px-1 py-0.5 hover:text-[var(--dashboard-accent)] transition-colors appearance-none pr-6 bg-[length:12px_12px] bg-[position:right_0.25rem_center] bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                }}
              >
                {routines.map((routine) => (
                  <option key={routine.id} value={routine.id}>
                    {routine.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-foreground">{displayName}</span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground md:text-sm">
            Est. Time
          </div>
          <div className="mt-1.5 leading-none">
            <span className="text-5xl font-semibold text-[var(--dashboard-accent-strong)] md:text-6xl">
              {displayMinutes}
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
          href={startSessionHref}
          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-3xl bg-[var(--dashboard-accent)] px-5 text-lg font-semibold uppercase tracking-[0.1em] text-black transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--dashboard-accent-strong)] md:min-h-16 md:text-xl"
        >
          <CirclePlay size={24} />
          Start Session
        </Link>
        <Link
          href={
            selectedRoutineId
              ? `${editHref}?routineId=${encodeURIComponent(selectedRoutineId)}`
              : editHref
          }
          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-3xl border border-border px-5 text-md font-semibold text-foreground transition-colors hover:bg-muted md:min-h-16 md:text-lg"
        >
          <PencilLine size={22} className="text-[var(--dashboard-accent)]" />
          Edit Routine
        </Link>
      </div>
    </section>
  );
}
