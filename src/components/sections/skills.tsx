import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { skillsByCategory } from "@/data/skills";

export function Skills() {
  const t = useTranslations("skills");

  const categories = [
    { key: "frontend", skills: skillsByCategory.frontend },
    { key: "backend", skills: skillsByCategory.backend },
    { key: "infrastructure", skills: skillsByCategory.infrastructure },
    { key: "tools", skills: skillsByCategory.tools },
  ] as const;

  return (
    <Section>
      <SectionHeader title={t("title")} centered />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div
            key={category.key}
            className="p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors"
          >
            <h3 className="font-semibold text-lg mb-4 text-accent">
              {t(category.key)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => (
                <Badge key={skill.name} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

