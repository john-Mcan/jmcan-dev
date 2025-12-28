"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export function CaseStudyLearnings() {
  const t = useTranslations("caseStudy.learnings");
  const tContact = useTranslations("contact");
  const items = t.raw("items") as string[];

  return (
    <Section className="bg-card/30">
      <div className="max-w-3xl mx-auto">
        <SectionHeader title={t("title")} />

        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          {items.map((item, index) => (
            <div
              key={item}
              className="group flex items-start gap-3 sm:gap-4 p-4 rounded-xl border border-border bg-card/50 hover:border-accent/30 hover:bg-card transition-all duration-300"
            >
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent/10 text-accent text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-sm sm:text-base text-foreground pt-1 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm sm:text-base text-muted mb-4 sm:mb-6">
            {tContact("subtitle")}
          </p>
          <Button asChild size="lg" className="group w-full sm:w-auto">
            <Link href="/contacto">
              <span>{tContact("title")}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

