"use client";

import { cn } from "@/lib/utils";
import { useAppIntl } from "@/components/providers/intl-provider";

export function LanguageToggle() {
  const { locale, toggleLocale } = useAppIntl();

  return (
    <button
      onClick={toggleLocale}
      className={cn(
        "relative flex h-9 items-center justify-center rounded-lg border border-border px-3",
        "bg-secondary/50 text-sm font-medium transition-all duration-200",
        "hover:bg-secondary hover:border-muted-foreground/30"
      )}
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <span className="uppercase">{locale === "es" ? "EN" : "ES"}</span>
    </button>
  );
}

