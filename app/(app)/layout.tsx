import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { HandMetal } from "lucide-react";
import { SidebarNav } from "@/components/app/sidebar-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <div style={styles.shell} className="bg-background text-foreground">
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logo} aria-hidden>
            <HandMetal size={28} />
          </div>
          <div>
            <div style={styles.brandName}>CodaTrack</div>
            <div style={styles.brandTagline}>VER 2.4.0</div>
          </div>
        </div>

        <SidebarNav />

        <div style={styles.footer}>
          <div style={styles.userAvatar}>
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                style={{ width: "100%", height: "100%", borderRadius: 999 }}
              />
            ) : null}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{user?.name ?? "User"}</div>
            <div style={styles.userPlan}>{user?.email ?? "Signed in"}</div>
          </div>

          <Link href="/api/auth/signout?callbackUrl=/signin" style={styles.signOutLink}>
            Sign out
          </Link>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.mainTopBar}>
          <ThemeToggle />
        </div>
        <div style={styles.container}>{children}</div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    color: "var(--foreground)",
  },
  sidebar: {
    padding: 16,
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  brand: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 12,
  },
  logo: {
    width: 56,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--logo-border)",
    background:
      "linear-gradient(135deg, var(--menu-active-bg-start) 0%, var(--menu-active-bg-end) 100%)",
    color: "var(--menu-digital-green)",
  },
  brandName: { fontWeight: 700, fontSize: 24, fontFamily: "var(--font-jetbrains-mono)" },
  brandTagline: { fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, opacity: 0.7 },
  footer: {
    padding: 12,
    borderRadius: 12,
    background: "var(--card)",
    border: "1px solid var(--border)",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "var(--muted)",
    overflow: "hidden",
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600 },
  userPlan: { fontSize: 12, opacity: 0.7 },
  main: { padding: 24 },
  mainTopBar: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  container: { maxWidth: 1200, margin: "0 auto" },
  signOutLink: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--muted)",
    color: "inherit",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
};
