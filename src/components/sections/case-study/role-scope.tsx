"use client";

import { useTranslations } from "next-intl";
import { User, Target, Code2, Server, Database, Rocket } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

const scopeItems = [
  { key: "architecture", icon: Code2 },
  { key: "frontend", icon: Code2 },
  { key: "backend", icon: Server },
  { key: "data", icon: Database },
  { key: "deployment", icon: Rocket },
] as const;

export function CaseStudyRoleScope() {
  const t = useTranslations("caseStudy.roleScope");

  return (
    <Section>
      <div className="max-w-4xl mx-auto">
        <SectionHeader title={t("title")} centered />

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Role */}
          <div className="p-5 sm:p-6 rounded-xl border border-border bg-card/50">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                <User className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">{t("role.title")}</h3>
            </div>
            <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
              {t("role.description")}
            </p>
          </div>

          {/* Scope */}
          <div className="p-5 sm:p-6 rounded-xl border border-border bg-card/50">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">{t("scope.title")}</h3>
            </div>
            <ul className="space-y-2">
              {scopeItems.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-center gap-3 text-sm sm:text-base text-muted">
                  <Icon className="h-4 w-4 text-accent/70 flex-shrink-0" />
                  <span>{t(`scope.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

