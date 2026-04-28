import { formatShortDate } from "@/lib/date";
import Link from "next/link";
import { History, Music2 } from "lucide-react";

export type SessionRow = {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  note: string | null;
  status: "completed" | "partial";
};

function formatSessionDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return formatShortDate(input);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}

type RecentSessionsProps = {
  sessions: SessionRow[];
  showHeader?: boolean;
  showViewAll?: boolean;
  viewAllHref?: string;
};

export function RecentSessions({
  sessions,
  showHeader = true,
  showViewAll = true,
  viewAllHref = "/sessions",
}: RecentSessionsProps) {
  return (
    <section className="session-log">
      {showHeader ? (
        <header className="session-log-header">
          <h2 className="session-log-title">
            <History size={16} className="session-log-title-icon" />
            Recent Sessions
          </h2>
          {showViewAll ? (
            <Link href={viewAllHref} className="session-log-view">
              View All
            </Link>
          ) : null}
        </header>
      ) : null}
      <div className="session-log-table-wrap">
        {sessions.length === 0 ? (
          <div className="session-log-empty">
            No sessions logged yet.
            <div className="mt-1 normal-case tracking-normal">
              Start a practice session to see entries here.
            </div>
          </div>
        ) : (
          <div className="session-log-table">
            <div className="session-log-head">
              <div className="session-log-col-type">Type</div>
              <div className="session-log-col-activity">Activity</div>
              <div className="session-log-col-date">Date</div>
              <div className="session-log-col-duration">Duration</div>
              <div className="session-log-col-status text-right">Status</div>
            </div>
            {sessions.map((s) => (
              <div key={s.id} className="session-log-row">
                <div className="session-log-type">
                  <Music2 size={18} />
                </div>
                <div className="session-log-activity">{s.note ?? "Practice Session"}</div>
                <div className="session-log-date">{formatSessionDate(s.started_at)}</div>
                <div className="session-log-duration">{formatDuration(s.duration_seconds)}</div>
                <div
                  className={`session-log-status ${
                    s.status === "partial" ? "session-log-status-partial" : ""
                  }`}
                >
                  {s.status === "partial" ? "In Progress" : "Completed"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
