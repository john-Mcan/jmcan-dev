"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg border border-border",
        "bg-secondary/50 transition-all duration-200",
        "hover:bg-secondary hover:border-muted-foreground/30"
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all duration-300",
          theme === "dark"
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        )}
      />
    </button>
  );
}

