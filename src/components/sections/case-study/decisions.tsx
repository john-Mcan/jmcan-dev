"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

const decisionKeys = ["nextjs", "supabase", "serverComponents", "seo"] as const;

export function CaseStudyDecisions() {
  const t = useTranslations("caseStudy.decisions");

  return (
    <Section>
      <SectionHeader title={t("title")} centered />

      <div className="max-w-4xl mx-auto">
        <div className="space-y-3 sm:space-y-4">
          {decisionKeys.map((key) => (
            <div
              key={key}
              className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border border-border bg-card/50 hover:border-accent/30 hover:bg-card transition-all duration-300"
            >
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {t(`${key}.title`)}
                </h3>
                <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
                  {t(`${key}.reason`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

