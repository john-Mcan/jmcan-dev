"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import type { Locale } from "@/i18n/config";
import { readLocalePref, writeLocalePref } from "@/lib/prefs";

import esMessages from "@/messages/es.json";
import enMessages from "@/messages/en.json";

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
  // Default: español. Persistimos sólo la preferencia explícita del usuario.
  const [locale, setLocale] = useState<Locale>("es");

  // next-intl tipa messages como AbstractIntlMessages, pero nuestro JSON incluye arrays
  // (ej. learnings.items). Runtime funciona, así que casteamos de forma explícita.
  const messages = useMemo(() => {
    return (locale === "en" ? enMessages : esMessages) as unknown as AbstractIntlMessages;
  }, [locale]);

  const toggleLocale = () => setLocale((prev) => (prev === "es" ? "en" : "es"));

  // Aplicar preferencia persistida DESPUÉS de hidratar para evitar mismatch de HTML traducido.
  useEffect(() => {
    const persisted = readLocalePref();
    if (persisted && persisted !== locale) setLocale(persisted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantener el atributo lang alineado con el locale actual (solo cliente).
  useEffect(() => {
    document.documentElement.lang = locale;
    writeLocalePref(locale);
  }, [locale]);

  const value = useMemo<IntlContextValue>(
    () => ({ locale, setLocale, toggleLocale }),
    [locale]
  );

  return (
    <IntlContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </IntlContext.Provider>
  );
}


