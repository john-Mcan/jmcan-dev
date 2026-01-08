"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/section";

export function CaseStudyLearnings() {
  const t = useTranslations("caseStudy.learnings");
  const items = t.raw("items") as string[];

  return (
    <Section>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t("title")}</h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
            {t("description")}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {items.map((item, index) => (
            <div
              key={item}
              className="group flex items-start gap-3 sm:gap-4 p-4 rounded-xl border border-border bg-card/50 hover:border-accent/30 hover:bg-card transition-all duration-300"
            >
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent/10 text-accent text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-sm sm:text-base text-foreground pt-1 leading-relaxed text-left">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
