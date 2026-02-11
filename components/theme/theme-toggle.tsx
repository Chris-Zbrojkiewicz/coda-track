"use client";

import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  return (
    <button
      type="button"
      onClick={() => {
        const nextIsDark = !isDark;
        const nextTheme: Theme = nextIsDark ? "dark" : "light";
        applyTheme(nextTheme);
        setIsDark(nextIsDark);
      }}
      className="inline-flex h-7 w-7 items-center justify-center p-0"
      aria-label="Toggle dark and light mode"
    >
      <span className="relative block h-7 w-7">
        <ToggleLeft
          size={28}
          className={`absolute inset-0 transition-all duration-200 ${
            isDark ? "translate-x-1 opacity-0" : "translate-x-0 opacity-100"
          }`}
        />
        <ToggleRight
          size={28}
          className={`absolute inset-0 transition-all duration-200 ${
            isDark ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
