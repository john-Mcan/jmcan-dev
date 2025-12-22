"use client";

import { useTranslations } from "next-intl";
import { Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

const challengeKeys = ["auth", "realtime", "feed", "roles"] as const;

export function CaseStudyChallenges() {
  const t = useTranslations("caseStudy.challenges");

  return (
    <Section className="bg-card/30">
      <SectionHeader title={t("title")} />

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {challengeKeys.map((key) => (
          <div
            key={key}
            className="group p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:border-accent/30 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10">
                <Lightbulb className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold">
                {t(`${key}.title`)}
              </h3>
            </div>

            {/* Problem */}
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-muted">{t(`${key}.problem`)}</p>
              </div>
            </div>

            {/* Solution */}
            <div className="p-3 sm:p-4 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-foreground">{t(`${key}.solution`)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

