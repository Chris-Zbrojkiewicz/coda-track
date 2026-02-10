"use client";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark");
        const nextTheme: Theme = isDark ? "light" : "dark";
        applyTheme(nextTheme);
      }}
      className="rounded-xl border bg-card px-3 py-2 text-sm text-card-foreground hover:bg-muted"
      aria-label="Toggle dark and light mode"
    >
      Toggle theme
    </button>
  );
}
