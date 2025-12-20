import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export function CaseStudyLearnings() {
  const t = useTranslations("caseStudy.learnings");
  const items = t.raw("items") as string[];

  return (
    <Section className="bg-card/30">
      <div className="max-w-3xl mx-auto">
        <SectionHeader title={t("title")} />

        <div className="space-y-4 mb-12">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-foreground">{item}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted mb-6">
            ¿Interesado en saber más sobre este proyecto?
          </p>
          <Button asChild size="lg" className="group">
            <Link href="/contacto">
              Hablemos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

