"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Settings2,
  SlidersHorizontal,
  Timer,
  type LucideIcon,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice/setup", label: "Session Setup", icon: SlidersHorizontal },
  { href: "/practice/session", label: "Practice Timer", icon: Timer },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/dashboard" && pathname === "/") return true;
  return pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-2">
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`menu-link ${active ? "menu-link-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="menu-link-icon">
              <item.icon size={18} strokeWidth={2.2} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
