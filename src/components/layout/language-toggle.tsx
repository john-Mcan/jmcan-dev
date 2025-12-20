"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { setLocaleCookie } from "@/lib/locale";

export function LanguageToggle() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const newLocale = locale === "es" ? "en" : "es";
    startTransition(() => {
      setLocaleCookie(newLocale);
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className={cn(
        "relative flex h-9 items-center justify-center rounded-lg border border-border px-3",
        "bg-secondary/50 text-sm font-medium transition-all duration-200",
        "hover:bg-secondary hover:border-muted-foreground/30",
        "disabled:opacity-50"
      )}
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <span className="uppercase">{locale === "es" ? "EN" : "ES"}</span>
    </button>
  );
}

