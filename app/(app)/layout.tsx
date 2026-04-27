import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { HandMetal, LogOut, Settings2 } from "lucide-react";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <div className="flex min-h-screen items-center justify-center p-6 text-center md:hidden">
        <div>
          <h1 className="text-xl font-semibold">Desktop view recommended</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            CodaTrack V1 is currently optimized for desktop. Mobile support is planned.
          </p>
        </div>
      </div>

      <div className="hidden md:block">
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
          </aside>

          <main style={styles.main}>
            <div style={styles.mainTopBar}>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" style={styles.userMenuTrigger} aria-label="Open account menu">
                    <Avatar className="size-9 border border-border/70">
                      <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User avatar"} />
                      <AvatarFallback>{(user?.name?.[0] ?? "U").toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-lg border-border/70 bg-card/95 p-1.5 shadow-lg shadow-black/10 backdrop-blur-sm"
                >
                  <DropdownMenuLabel className="px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Account
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings2 />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/api/auth/signout?callbackUrl=/signin">
                      <LogOut />
                      Log out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div style={styles.container}>{children}</div>
          </main>
        </div>
      </div>
    </>
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
  main: { padding: 24 },
  mainTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 8,
  },
  container: { maxWidth: 1200, margin: "0 auto" },
  userMenuTrigger: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "color-mix(in oklab, var(--card) 92%, transparent)",
    color: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
};
