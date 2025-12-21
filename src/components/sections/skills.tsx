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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <div
            key={category.key}
            className="group relative p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-accent/30 transition-all duration-300"
          >
            {/* Indicator line */}
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Category title */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <h3 className="font-semibold text-base sm:text-lg text-foreground">
                {t(category.key)}
              </h3>
            </div>
            
            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {category.skills.map((skill) => (
                <Badge 
                  key={skill.name} 
                  variant="secondary"
                  className="text-xs sm:text-sm"
                >
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

