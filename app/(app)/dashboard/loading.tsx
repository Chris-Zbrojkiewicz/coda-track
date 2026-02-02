import { Page } from "@/components/ui/page";

export default function DashboardLoading() {
  return (
    <Page title="Dashboard" description="Your practice overview for the week.">
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    </Page>
  );
}
