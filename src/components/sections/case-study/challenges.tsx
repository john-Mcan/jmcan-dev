import { useTranslations } from "next-intl";
import { Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

const challengeKeys = ["auth", "realtime", "feed", "roles"] as const;

export function CaseStudyChallenges() {
  const t = useTranslations("caseStudy.challenges");

  return (
    <Section className="bg-card/30">
      <SectionHeader title={t("title")} />

      <div className="grid md:grid-cols-2 gap-6">
        {challengeKeys.map((key) => (
          <div
            key={key}
            className="p-6 rounded-xl border border-border bg-card/50"
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              {t(`${key}.title`)}
            </h3>

            {/* Problem */}
            <div className="mb-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted">{t(`${key}.problem`)}</p>
              </div>
            </div>

            {/* Solution */}
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{t(`${key}.solution`)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

