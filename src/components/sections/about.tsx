"use client";

import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

export function About() {
  const t = useTranslations("about");

  const highlights = [
    t("highlights.experience"),
    t("highlights.fullstack"),
    t("highlights.modern"),
  ];

  return (
    <Section className="bg-card/30">
      {/* Mobile: Header arriba */}
      <div className="md:hidden">
        <SectionHeader title={t("title")} />
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Desktop: Header integrado en la columna izquierda */}
        <div className="space-y-6">
          <div className="hidden md:block">
            <SectionHeader title={t("title")} />
          </div>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {highlights.map((highlight) => (
            <div
              key={highlight}
              className="group flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border hover:border-accent/30 hover:bg-secondary/50 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm sm:text-base text-foreground pt-1">{highlight}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
