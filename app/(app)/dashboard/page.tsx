import { Page } from "@/components/ui/page";

export default function DashboardPage() {
  return (
    <Page
      title="Dashboard"
      description="Your practice overview for the week."
      right={<div className="text-sm text-muted-foreground">Schedule</div>}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6">Up next</div>
        <div className="rounded-2xl border bg-card p-6">Current streak</div>
        <div className="rounded-2xl border bg-card p-6">This week</div>
      </div>
    </Page>
  );
}
