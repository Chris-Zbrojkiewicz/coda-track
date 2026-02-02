"use client";

import { Page, Section } from "@/components/ui/page";
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
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAtUi, setStartedAtUi] = useState<Date | null>(null);

  const startedAtRef = useRef<Date | null>(null);
  const runStartedPerfRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);

  useEffect(() => {
    if (!isRunning) return;

    // tick ~4x/sec for smooth UI without being too chatty
    const id = window.setInterval(() => {
      const runStart = runStartedPerfRef.current;
      if (runStart == null) return;

      const ms = accumulatedMsRef.current + (performance.now() - runStart);
      setElapsedSeconds(Math.floor(ms / 1000));
    }, 250);

    return () => window.clearInterval(id);
  }, [isRunning]);

  function start() {
    if (isRunning) return;

    // First ever start
    if (!startedAtRef.current) {
      const now = new Date();
      startedAtRef.current = now;
      setStartedAtUi(now);
    }

    runStartedPerfRef.current = performance.now();
    setIsRunning(true);
  }

  function pause() {
    if (!isRunning) return;

    const runStart = runStartedPerfRef.current;
    if (runStart != null) {
      accumulatedMsRef.current += performance.now() - runStart;
    }
    runStartedPerfRef.current = null;
    setIsRunning(false);
  }

  function resume() {
    if (isRunning) return;
    if (!startedAtRef.current) {
      // if someone hits resume without start, treat as start
      return start();
    }
    runStartedPerfRef.current = performance.now();
    setIsRunning(true);
  }

  function endSession() {
    // For #11: no backend. We just "finalize" locally.
    if (isRunning) pause();

    const startedAt = startedAtRef.current;
    const durationSeconds = elapsedSeconds;

    // Reset local timer state (so it’s safe)
    startedAtRef.current = null;
    setStartedAtUi(null);
    runStartedPerfRef.current = null;
    accumulatedMsRef.current = 0;
    setElapsedSeconds(0);
    setIsRunning(false);

    // Temporary UX for V1:
    // In #13 we’ll POST and redirect. For now show a simple confirmation.
    if (!startedAt) {
      alert("No session started yet.");
      return;
    }

    const endedAt = new Date();
    alert(
      `Session ended.\n\nStarted: ${startedAt.toISOString()}\nEnded: ${endedAt.toISOString()}\nDuration: ${durationSeconds}s`
    );
  }

  return (
    <Page title="Practice" description="Track a focused practice session.">
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Timer">
          <div className="text-5xl font-semibold tabular-nums">{formatHMS(elapsedSeconds)}</div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!startedAtUi ? (
              <button
                onClick={start}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
              >
                Start
              </button>
            ) : isRunning ? (
              <button
                onClick={pause}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resume}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
              >
                Resume
              </button>
            )}

            <button
              onClick={endSession}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
            >
              End session
            </button>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            {isRunning ? "Running" : startedAtUi ? "Paused" : "Not started"}
          </div>
        </Section>

        <Section title="Notes (V1 placeholder)">
          <div className="text-sm text-muted-foreground">
            We’ll add notes + save flow in Issue #13.
          </div>
        </Section>
      </div>
    </Page>
  );
}
