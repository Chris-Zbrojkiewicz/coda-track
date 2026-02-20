"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Page } from "@/components/ui/page";
import { InlineError } from "@/components/ui/inline-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PencilLine, X } from "lucide-react";

type Routine = {
  id: string;
  name: string;
  estimatedMinutes: number;
  createdAt: string | null;
};

export function RoutineSetup() {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [name, setName] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("25");
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();

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
          const fetchedRoutines = (json?.data?.routines ?? []) as Routine[];
          setRoutines(fetchedRoutines);

          // Check if there's a routine ID in URL params to edit
          const routineId = searchParams.get("routineId");
          if (routineId && fetchedRoutines.length > 0) {
            const routineToEdit = fetchedRoutines.find((r) => r.id === routineId);
            if (routineToEdit) {
              setEditingRoutineId(routineToEdit.id);
              setEditName(routineToEdit.name);
              setEditEstimatedMinutes(String(routineToEdit.estimatedMinutes));
            }
          }
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
  }, [searchParams]);

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

  const startEditing = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setEditName(routine.name);
    setEditEstimatedMinutes(String(routine.estimatedMinutes));
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingRoutineId(null);
    setEditName("");
    setEditEstimatedMinutes("");
    setEditError(null);
  };

  const onEditSubmit = (routineId: string) => {
    if (isEditPending) return;

    setEditError(null);

    const trimmed = editName.trim();
    const minutesNumber = parseInt(editEstimatedMinutes, 10);

    if (!trimmed) {
      setEditError("Name is required.");
      return;
    }
    if (!Number.isInteger(minutesNumber) || minutesNumber <= 0) {
      setEditError("Estimated minutes must be a positive whole number.");
      return;
    }

    startEditTransition(async () => {
      try {
        const res = await fetch(`/api/routines/${routineId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmed,
            estimatedMinutes: minutesNumber,
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
          setEditError(json?.error?.message ?? "Unable to update routine.");
          return;
        }

        const updatedRoutine = json?.data?.routine as Routine | undefined;
        if (updatedRoutine) {
          setRoutines((prev) => prev.map((r) => (r.id === routineId ? updatedRoutine : r)));
          cancelEditing();
        }
      } catch (err) {
        setEditError("Unable to update routine.");
        console.error("Failed to update routine:", err);
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
                const isEditing = editingRoutineId === routine.id;

                return (
                  <Card key={routine.id} className="flex flex-col gap-3 p-4">
                    {isEditing ? (
                      <>
                        {editError ? <InlineError message={editError} /> : null}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            onEditSubmit(routine.id);
                          }}
                          className="space-y-3"
                        >
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              Name
                            </label>
                            <Input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              autoComplete="off"
                              invalid={!editName.trim() && !!editError}
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
                              value={editEstimatedMinutes}
                              onChange={(e) => setEditEstimatedMinutes(e.target.value)}
                              invalid={!editEstimatedMinutes.trim() && !!editError}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={isEditPending} size="sm" className="flex-1">
                              {isEditPending ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={isEditPending}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{routine.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ~{routine.estimatedMinutes} min • Created {createdLabel}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(routine)}
                            className="shrink-0 h-8 w-8"
                            aria-label={`Edit ${routine.name}`}
                          >
                            <PencilLine size={16} />
                          </Button>
                        </div>
                      </>
                    )}
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
