import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Section } from "@/components/ui/section";

export function CaseStudyProblem() {
  const t = useTranslations("caseStudy.problem");

  return (
    <Section>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-4 p-6 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
            <p className="text-lg text-muted leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

