"use client";

import { useTranslations } from "next-intl";
import { PageHero } from "@/components/ui/page-hero";

export function ContactHero() {
  const t = useTranslations("contact");

  return (
    <PageHero accentBlur="left">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          {t("title")}
        </h1>
        <p className="text-xl text-muted leading-relaxed">{t("subtitle")}</p>
      </div>
    </PageHero>
  );
}

