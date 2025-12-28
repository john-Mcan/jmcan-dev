"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import type { Locale } from "@/i18n/config";
import { readLocalePref, writeLocalePref } from "@/lib/prefs";

import esMessages from "@/messages/es.json";

type IntlContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const IntlContext = createContext<IntlContextValue | null>(null);

export function useAppIntl() {
  const ctx = useContext(IntlContext);
  if (!ctx) {
    throw new Error("useAppIntl must be used within <AppIntlProvider />");
  }
  return ctx;
}

export function AppIntlProvider({ children }: { children: React.ReactNode }) {
  const [intl, setIntl] = useState<{
    locale: Locale;
    messages: AbstractIntlMessages;
  }>(() => ({
    locale: "es",
    messages: esMessages as unknown as AbstractIntlMessages,
  }));

  // Evita que una importación lenta de mensajes sobrescriba un cambio posterior (race condition).
  const loadIdRef = useRef(0);
  const prefetchedEnRef = useRef(false);

  const setLocale = useCallback((nextLocale: Locale) => {
    const loadId = ++loadIdRef.current;

    if (nextLocale === "es") {
      setIntl({
        locale: "es",
        messages: esMessages as unknown as AbstractIntlMessages,
      });
      return;
    }

    void (async () => {
      const mod = await import("@/messages/en.json");
      if (loadId !== loadIdRef.current) return;

      setIntl({
        locale: "en",
        messages: mod.default as unknown as AbstractIntlMessages,
      });
    })();
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(intl.locale === "es" ? "en" : "es");
  }, [intl.locale, setLocale]);

  useEffect(() => {
    const persisted = readLocalePref();
    if (persisted) setLocale(persisted);
  }, [setLocale]);

  useEffect(() => {
    // Prefetch suave para que el primer switch a EN sea casi instantáneo,
    // sin cargar `en.json` en el chunk inicial.
    if (prefetchedEnRef.current) return;
    if (intl.locale !== "es") return;
    prefetchedEnRef.current = true;

    const prefetch = () => {
      void import("@/messages/en.json");
    };

    // Nota: en TS recientes `requestIdleCallback` ya existe en el tipo `Window`,
    // por lo que el guard con `"prop" in window` puede volver el `else` inalcanzable
    // (y estrechar `window` a `never`). Usamos un chequeo por tipo en runtime.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(prefetch, 1500);
    return () => window.clearTimeout(id);
  }, [intl.locale]);

  useEffect(() => {
    document.documentElement.lang = intl.locale;
    writeLocalePref(intl.locale);
  }, [intl.locale]);

  const value = useMemo<IntlContextValue>(
    () => ({ locale: intl.locale, setLocale, toggleLocale }),
    [intl.locale, setLocale, toggleLocale]
  );

  return (
    <IntlContext.Provider value={value}>
      <NextIntlClientProvider locale={intl.locale} messages={intl.messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </IntlContext.Provider>
  );
}

