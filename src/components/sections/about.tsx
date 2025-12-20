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
      <SectionHeader title={t("title")} />
      
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-lg text-muted leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="space-y-4">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border"
            >
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{highlight}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

