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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="p-4 rounded-xl border border-border bg-card/50 text-center"
          >
            <div className="text-2xl font-bold text-accent">{metric.value}</div>
            <div className="text-xs text-muted mt-1">{t(metric.key)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

