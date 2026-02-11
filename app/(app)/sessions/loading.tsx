import { Page } from "@/components/ui/page";

export default function SessionsLoading() {
  return (
    <Page title="Sessions" description="Your full session history.">
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Loading sessions...
      </div>
    </Page>
  );
}
