import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Section } from "@/components/ui/section";

export function CaseStudyProblem() {
  const t = useTranslations("caseStudy.problem");

  return (
    <Section>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start gap-4 p-5 sm:p-6 rounded-xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-destructive/10 flex-shrink-0">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t("title")}</h2>
            <p className="text-base sm:text-lg text-muted leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

