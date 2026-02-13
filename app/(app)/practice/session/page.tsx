"use client";

import { Page } from "@/components/ui/page";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function PracticeSessionPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "running" | "paused">("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [practiceItem, setPracticeItem] = useState("");
  const [bpm, setBpm] = useState("");
  const [showPracticeItemError, setShowPracticeItemError] = useState(false);
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
    if (phase === "idle") return;

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

  function handlePlay() {
    setErrorMessage(null);
    if (!practiceItem.trim()) {
      setShowPracticeItemError(true);
      return;
    }
    setShowPracticeItemError(false);
    if (phase === "idle") {
      start();
      return;
    }
    resume();
  }

  function getDurationMs() {
    const runStart = runStartedPerfRef.current;
    if (phase === "running" && runStart != null) {
      return accumulatedMsRef.current + (performance.now() - runStart);
    }
    return accumulatedMsRef.current;
  }

  async function endSession() {
    if (isSubmitting) return;

    setErrorMessage(null);
    const item = practiceItem.trim();
    if (!item) {
      setErrorMessage("Practice item is required.");
      return;
    }
    const bpmValue = bpm.trim();
    const note = bpmValue ? `${item} @ ${bpmValue} bpm` : item;
    const durationSeconds = Math.max(0, Math.floor(getDurationMs() / 1000));

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
          note,
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
      setPracticeItem("");
      setBpm("");
      setPhase("idle");

      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save session.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const TARGET_SECONDS = 5 * 60;
  const progressRatio = Math.min(1, elapsedSeconds / TARGET_SECONDS);
  const ringRadius = 168;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);
  const hasPracticeItem = practiceItem.trim().length > 0;
  const durationSecondsLive = Math.floor(getDurationMs() / 1000);
  const inlineErrorMessage =
    showPracticeItemError && !hasPracticeItem ? "Practice item is required." : errorMessage;

  return (
    <Page title="Practice Session" description="Track a focused session.">
      <section className="relative overflow-hidden rounded-4xl border border-border bg-card p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <div
            className="relative mx-auto grid h-[360px] w-[360px] place-items-center md:h-[420px] md:w-[420px]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TARGET_SECONDS}
            aria-valuenow={Math.min(TARGET_SECONDS, elapsedSeconds)}
            aria-label="Session progress"
          >
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 380 380">
              <circle
                cx="190"
                cy="190"
                r={ringRadius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="10"
              />
              <circle
                cx="190"
                cy="190"
                r={ringRadius}
                fill="none"
                stroke="var(--dashboard-accent)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: "stroke-dashoffset 250ms linear" }}
              />
            </svg>

            <div className="relative z-[1] text-center">
              <div className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                Time Elapsed
              </div>
              <div className="mt-4 text-7xl font-semibold tabular-nums text-foreground md:text-8xl">
                {formatMMSS(elapsedSeconds)}
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {phase === "running" ? "Running" : phase === "paused" ? "Paused" : "Ready"}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-center">
            <input
              value={practiceItem}
              onChange={(event) => {
                setPracticeItem(event.target.value);
                if (event.target.value.trim()) {
                  setShowPracticeItemError(false);
                }
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
              placeholder="Enter practice item"
              required
              className={[
                "w-full border-0 bg-transparent text-center text-3xl font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none",
                showPracticeItemError && !hasPracticeItem
                  ? "underline decoration-destructive/60 underline-offset-8"
                  : "",
              ].join(" ")}
              aria-label="Practice item"
            />
            <input
              value={bpm}
              onChange={(event) => {
                const next = event.target.value.replace(/[^\d]/g, "").slice(0, 3);
                setBpm(next);
              }}
              placeholder="Enter BPM (optional)"
              inputMode="numeric"
              pattern="\d*"
              className="w-full border-0 bg-transparent text-center text-base text-muted-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              aria-label="Beats per minute"
            />
            <div className="h-5">
              {inlineErrorMessage ? (
                <p className="text-sm text-destructive" aria-live="polite">
                  {inlineErrorMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mx-auto mt-8 flex w-fit items-center gap-4 rounded-3xl border border-border bg-card/40 p-3">
            <button
              onClick={handlePlay}
              disabled={isSubmitting || phase === "running"}
              className="inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-[var(--dashboard-accent)] text-black transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={phase === "idle" ? "Start session" : "Resume session"}
              title={phase === "idle" ? "Start" : "Resume"}
            >
              <Play size={24} />
            </button>

            <button
              onClick={pause}
              disabled={isSubmitting || phase !== "running"}
              className="inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border border-border bg-muted/50 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pause session"
              title="Pause"
            >
              <Pause size={24} />
            </button>

            <button
              onClick={endSession}
              disabled={isSubmitting || phase === "idle" || durationSecondsLive < 10}
              className="inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border border-border bg-muted/50 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Stop session"
              title={
                durationSecondsLive < 10 ? "Minimum 10 seconds" : isSubmitting ? "Saving…" : "Stop"
              }
            >
              <Square size={22} />
            </button>
          </div>

        </div>
      </section>
    </Page>
  );
}
