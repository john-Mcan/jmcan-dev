"use client";

import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/section";
import { codeMetrics } from "@/data/projects";

export function CaseStudyMetrics() {
  const t = useTranslations("caseStudy.metrics");

  const metrics = [
    { key: "components", value: codeMetrics.components },
    { key: "hooks", value: codeMetrics.hooks },
    { key: "endpoints", value: codeMetrics.endpoints },
    { key: "services", value: codeMetrics.services },
    { key: "tables", value: codeMetrics.tables },
    { key: "policies", value: codeMetrics.policies },
    { key: "lines", value: codeMetrics.lines },
  ];

  return (
    <Section>
      <SectionHeader title={t("title")} centered />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="group relative p-4 sm:p-5 rounded-xl border border-border bg-card/50 text-center hover:bg-card hover:border-accent/30 transition-all duration-300"
          >
            <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-accent/50 rounded-b opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="text-xl sm:text-2xl font-bold text-accent mb-1">
              {metric.value}
            </div>
            <div className="text-[10px] sm:text-xs text-muted uppercase tracking-wide">
              {t(metric.key)}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

