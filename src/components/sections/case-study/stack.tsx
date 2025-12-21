import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stackCategories.map((category) => (
          <div
            key={category.title}
            className="group relative p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-accent/30 transition-all duration-300"
          >
            {/* Indicator line */}
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Category header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <h3 className="font-semibold text-base sm:text-lg text-foreground">{category.title}</h3>
            </div>
            
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {category.items.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs sm:text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Diagram */}
      <div className="mt-8 sm:mt-12 p-4 sm:p-8 rounded-xl border border-border bg-card/30 overflow-hidden">
        <div className="text-center text-muted font-mono text-[10px] sm:text-xs md:text-sm">
          <pre className="overflow-x-auto whitespace-pre">
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

