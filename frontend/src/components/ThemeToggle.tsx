"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-7 w-14 rounded-full bg-muted" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border/50 bg-muted/60 backdrop-blur-sm transition-colors duration-300 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Icons on the track */}
      <Sun className="absolute left-1.5 h-3.5 w-3.5 text-amber-500 transition-opacity duration-300"
        style={{ opacity: isDark ? 0.3 : 0 }}
      />
      <Moon className="absolute right-1.5 h-3.5 w-3.5 text-blue-400 transition-opacity duration-300"
        style={{ opacity: isDark ? 0 : 0.3 }}
      />
      {/* Sliding knob */}
      <span
        className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-foreground shadow-sm transition-all duration-300 ease-[cubic-bezier(0.68,-0.2,0.27,1.2)]"
        style={{ transform: isDark ? "translateX(30px)" : "translateX(4px)" }}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-background" />
        ) : (
          <Sun className="h-3 w-3 text-background" />
        )}
      </span>
    </button>
  );
}
