"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, Users, MessageSquare, Shield, BarChart3, Award, Radio } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

const featureIcons: Record<string, React.ElementType> = {
  communities: Users,
  content: MessageSquare,
  moderation: Shield,
  polls: BarChart3,
  badges: Award,
  realtime: Radio,
};

const featureKeys = [
  "communities",
  "content",
  "moderation",
  "polls",
  "badges",
  "realtime",
] as const;

export function CaseStudySolution() {
  const t = useTranslations("caseStudy.solution");

  return (
    <Section className="bg-card/30">
      <SectionHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {featureKeys.map((key) => {
          const Icon = featureIcons[key] || CheckCircle;
          return (
            <div
              key={key}
              className="group relative p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:border-accent/30 hover:bg-card transition-all duration-300"
            >
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-accent/50 rounded-b opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-accent/10 text-accent mb-3 sm:mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm sm:text-base text-foreground leading-relaxed text-left">{t(`features.${key}`)}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

