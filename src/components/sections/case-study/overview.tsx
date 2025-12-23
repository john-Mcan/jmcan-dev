"use client";

import { useTranslations } from "next-intl";
import { Users, MessageSquare, ThumbsUp, BarChart3, MessagesSquare } from "lucide-react";
import { Section } from "@/components/ui/section";
import { fandomsProject } from "@/data/projects";

const metricIcons: Record<string, React.ElementType> = {
  users: Users,
  posts: MessageSquare,
  comments: MessagesSquare,
  interactions: ThumbsUp,
  messages: MessageSquare,
  communities: Users,
};

export function CaseStudyOverview() {
  const t = useTranslations("caseStudy");
  const tMetrics = useTranslations("project.metrics");
  const project = fandomsProject;

  return (
    <Section className="bg-card/30">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t("overview.title")}</h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            {t("overview.description")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {project.metrics.map((metric) => {
            const Icon = metricIcons[metric.key] || BarChart3;
            return (
              <div
                key={metric.key}
                className="group relative p-4 sm:p-5 rounded-xl border border-border bg-card/50 text-center hover:bg-card hover:border-accent/30 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 mb-3">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                
                <div className="text-lg sm:text-xl font-bold">
                  {metric.value}
                  {metric.suffix && (
                    <span className="text-accent">{metric.suffix}</span>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-muted mt-1 uppercase tracking-wide">
                  {tMetrics(metric.key)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

