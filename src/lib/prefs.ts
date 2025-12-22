import type { Locale } from "@/i18n/config";
import type { Theme } from "@/components/providers/theme-provider";

const PREFS_KEYS = {
  theme: "jmcan:theme",
  locale: "jmcan:locale",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readThemePref(): Theme | null {
  if (!canUseStorage()) return null;
  try {
    const v = window.localStorage.getItem(PREFS_KEYS.theme);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

export function writeThemePref(theme: Theme): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(PREFS_KEYS.theme, theme);
  } catch {
    // ignore (private mode / storage blocked)
  }
}

export function readLocalePref(): Locale | null {
  if (!canUseStorage()) return null;
  try {
    const v = window.localStorage.getItem(PREFS_KEYS.locale);
    return v === "es" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

export function writeLocalePref(locale: Locale): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(PREFS_KEYS.locale, locale);
  } catch {
    // ignore (private mode / storage blocked)
  }
}

