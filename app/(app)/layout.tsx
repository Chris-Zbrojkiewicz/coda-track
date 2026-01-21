import Link from "next/link";
import { auth } from "@/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice/setup", label: "Session Setup" },
  { href: "/practice/session", label: "Practice Timer" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {

  const session = await auth();
  const user = session?.user;

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logo} aria-hidden />
          <div>
            <div style={styles.brandName}>CodaTrack</div>
            <div style={styles.brandTagline}>Practice, consistently</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

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

      <a href="/api/auth/signout?callbackUrl=/signin" style={styles.signOutLink}>
        Sign out
      </a>
      </div>
      </aside>

      <main style={styles.main}>
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
    background: "#0b1220",
    color: "#e5e7eb",
  },
  sidebar: {
    padding: 16,
    borderRight: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  brand: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: "rgba(99,102,241,0.25)",
  },
  brandName: { fontWeight: 700, fontSize: 14 },
  brandTagline: { fontSize: 12, opacity: 0.7 },
  nav: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  navLink: {
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: "inherit",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  footer: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600 },
  userPlan: { fontSize: 12, opacity: 0.7 },
  main: { padding: 24 },
  container: { maxWidth: 1200, margin: "0 auto" 
  },
  signOutLink: {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "inherit",
  textDecoration: "none",
  whiteSpace: "nowrap",
  },
};
