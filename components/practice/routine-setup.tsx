"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Page } from "@/components/ui/page";
import { InlineError } from "@/components/ui/inline-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Routine = {
  id: string;
  name: string;
  estimatedMinutes: number;
  createdAt: string | null;
};

export function RoutineSetup() {
  const nameRef = useRef<HTMLInputElement | null>(null);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [name, setName] = useState("Technical Shred V1");
  const [estimatedMinutes, setEstimatedMinutes] = useState("25");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const res = await fetch("/api/routines", { cache: "no-store" });
        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
          if (!cancelled) setLoadError(json?.error?.message ?? "Unable to load routines.");
          return;
        }

        if (!cancelled) {
          setRoutines((json?.data?.routines ?? []) as Routine[]);
        }
      } catch {
        if (!cancelled) setLoadError("Unable to load routines.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (isPending) return;

    setSubmitError(null);

    const trimmed = name.trim();
    const minutesNumber = parseInt(estimatedMinutes, 10);

    if (!trimmed) {
      setSubmitError("Name is required.");
      return;
    }
    if (!Number.isInteger(minutesNumber) || minutesNumber <= 0) {
      setSubmitError("Estimated minutes must be a positive whole number.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/routines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmed,
            estimatedMinutes: minutesNumber,
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
          setSubmitError(json?.error?.message ?? "Unable to save routine.");
          return;
        }

        const routine = json?.data?.routine as Routine | undefined;
        if (routine) setRoutines((prev) => [routine, ...prev]);

        // reset form
        setName("");
        setEstimatedMinutes("25");
        nameRef.current?.focus();
      } catch {
        setSubmitError("Unable to save routine.");
      }
    });
  };

  return (
    <Page title="Session Setup" description="Create lightweight practice routines you can reuse.">
      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold tracking-tight">New routine</h2>
          <p className="text-sm text-muted-foreground">
            Give your session a name and an estimated length. Detailed segment tracking can come
            later.
          </p>

          {submitError ? <InlineError message={submitError} /> : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Name
              </label>
              <Input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Technical Shred V1"
                autoComplete="off"
                invalid={!name.trim() && !!submitError}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Estimated minutes
              </label>
              <Input
                type="number"
                min={1}
                max={600}
                step={1}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                invalid={!estimatedMinutes.trim() && !!submitError}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full md:w-auto">
              {isPending ? "Saving…" : "Save routine"}
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Saved routines</h2>
          </div>

          {loadError ? <InlineError message={loadError} /> : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading routines…</p>
          ) : routines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any routines yet. Create one on the left to get started.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {routines.map((routine) => {
                const createdLabel = routine.createdAt
                  ? new Date(routine.createdAt).toLocaleDateString()
                  : "—";

                return (
                  <Card key={routine.id} className="flex flex-col gap-1.5 p-4">
                    <div className="truncate text-sm font-medium">{routine.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ~{routine.estimatedMinutes} min • Created {createdLabel}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
