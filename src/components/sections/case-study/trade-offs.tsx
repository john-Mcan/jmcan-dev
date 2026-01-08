"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/section";

export function CaseStudyTradeOffs() {
  const t = useTranslations("caseStudy.tradeOffs");
  const improvements = t.raw("improvements") as string[];

  return (
    <Section className="bg-card/30">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t("title")}</h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
            {t("description")}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {improvements.map((item, index) => (
            <div
              key={index}
              className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card/50 hover:border-accent/30 transition-all duration-300"
            >
              <ArrowRight className="h-4 w-4 text-accent flex-shrink-0" />
              <p className="text-sm sm:text-base text-foreground text-left">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
