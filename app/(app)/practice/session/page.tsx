"use client";

import { Page, Section } from "@/components/ui/page";
import { InlineError } from "@/components/ui/inline-error";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;

  const two = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${two(mm)}:${two(ss)}` : `${mm}:${two(ss)}`;
}

export default function PracticeSessionPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "running" | "paused">("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startedAtRef = useRef<Date | null>(null);
  const clientSessionIdRef = useRef<string | null>(null);
  const runStartedPerfRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);

  useEffect(() => {
    if (phase !== "running") return;

    // tick ~4x/sec for smooth UI without being too chatty
    const id = window.setInterval(() => {
      const runStart = runStartedPerfRef.current;
      if (runStart == null) return;

      const ms = accumulatedMsRef.current + (performance.now() - runStart);
      setElapsedSeconds(Math.floor(ms / 1000));
    }, 250);

    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  function start() {
    if (phase === "running") return;
    setErrorMessage(null);

    // First ever start
    if (!startedAtRef.current) {
      const now = new Date();
      startedAtRef.current = now;
    }
    if (!clientSessionIdRef.current) {
      clientSessionIdRef.current = crypto.randomUUID();
    }

    runStartedPerfRef.current = performance.now();
    setPhase("running");
  }

  function pause() {
    if (phase !== "running") return;

    const runStart = runStartedPerfRef.current;
    if (runStart != null) {
      accumulatedMsRef.current += performance.now() - runStart;
    }
    runStartedPerfRef.current = null;
    setPhase("paused");
    setElapsedSeconds(Math.floor(accumulatedMsRef.current / 1000));
  }

  function resume() {
    if (phase === "running") return;
    if (!startedAtRef.current) {
      // if someone hits resume without start, treat as start
      return start();
    }
    setErrorMessage(null);
    runStartedPerfRef.current = performance.now();
    setPhase("running");
  }

  async function endSession() {
    if (isSubmitting) return;

    setErrorMessage(null);
    if (phase === "running") pause();

    const startedAt = startedAtRef.current;
    const clientSessionId = clientSessionIdRef.current;
    if (!startedAt) {
      setErrorMessage("No session started yet.");
      return;
    }
    if (!clientSessionId) {
      setErrorMessage("Session id missing. Please start again.");
      return;
    }

    const durationSeconds = Math.max(0, Math.floor(accumulatedMsRef.current / 1000));
    const endedAt = new Date();

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          durationSeconds,
          status: "completed",
          clientSessionId,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const message = json?.error?.message ?? "Unable to save session.";
        setErrorMessage(message);
        return;
      }

      // Reset local timer state once we know it saved.
      startedAtRef.current = null;
      clientSessionIdRef.current = null;
      runStartedPerfRef.current = null;
      accumulatedMsRef.current = 0;
      setElapsedSeconds(0);
      setPhase("idle");

      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save session.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page title="Practice" description="Track a focused practice session.">
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Timer">
          <div className="text-5xl font-semibold tabular-nums">{formatHMS(elapsedSeconds)}</div>

          <div className="mt-4 flex flex-wrap gap-2">
            {phase === "idle" ? (
              <button
                onClick={start}
                disabled={isSubmitting}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Start
              </button>
            ) : phase === "running" ? (
              <button
                onClick={pause}
                disabled={isSubmitting}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resume}
                disabled={isSubmitting}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Resume
              </button>
            )}

            <button
              onClick={endSession}
              disabled={isSubmitting || phase === "idle"}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "End session"}
            </button>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            {phase === "running" ? "Running" : phase === "paused" ? "Paused" : "Not started"}
          </div>

          {errorMessage ? (
            <div className="mt-4">
              <InlineError message={errorMessage} />
            </div>
          ) : null}
        </Section>

        <Section title="Notes (V1 placeholder)">
          <div className="text-sm text-muted-foreground">Notes coming next.</div>
        </Section>
      </div>
    </Page>
  );
}
