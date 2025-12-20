import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { fandomsProject } from "@/data/projects";

const stackCategories = [
  {
    title: "Frontend",
    items: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Framer Motion"],
  },
  {
    title: "Backend",
    items: ["PostgreSQL", "Supabase", "API Routes", "WebSockets"],
  },
  {
    title: "Infrastructure",
    items: ["Vercel", "Cloudflare R2", "Supabase Cloud"],
  },
  {
    title: "Tools & Libraries",
    items: ["TanStack Query", "Zustand", "Radix UI", "Resend"],
  },
];

export function CaseStudyStack() {
  const t = useTranslations("caseStudy.stack");

  return (
    <Section>
      <SectionHeader title={t("title")} centered />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stackCategories.map((category) => (
          <div
            key={category.title}
            className="p-6 rounded-xl border border-border bg-card/50"
          >
            <h3 className="font-semibold text-accent mb-4">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.items.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Diagram Placeholder */}
      <div className="mt-12 p-8 rounded-xl border border-border bg-card/30">
        <div className="text-center text-muted font-mono text-sm">
          <pre className="overflow-x-auto">
{`[Usuario] ──▶ [Vercel Edge] ──▶ [Next.js App]
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
              [API Routes]    [Server Components]   [Client]
                    │                 │                 │
                    └────────┬────────┘                 │
                             │                          │
                       [Supabase]                       │
                      /    │    \\                       │
            [PostgreSQL] [Auth] [Realtime] ◀───────────┘
                             │
                      [Cloudflare R2]`}
          </pre>
        </div>
      </div>
    </Section>
  );
}

