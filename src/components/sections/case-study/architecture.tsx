"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/section";

export function CaseStudyArchitecture() {
  const t = useTranslations("caseStudy.architecture");

  return (
    <Section className="bg-card/30">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t("title")}</h2>
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
              {t("description")}
            </p>
            <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
              {t("backend")}
            </p>
            <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
              {t("rendering")}
            </p>
            <p className="text-sm sm:text-base text-muted leading-relaxed text-justify">
              {t("media")}
            </p>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="p-4 sm:p-6 rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="text-muted font-mono text-[10px] sm:text-xs leading-relaxed">
            <pre className="overflow-x-auto whitespace-pre">
{`[Usuario/Navegador]
   │  HTTP
   ▼
[Vercel Edge Network]
   │
   ├─(Middleware Edge, solo rutas match)
   │
   ▼
[Next.js App Router (Node.js runtime)]
   ├─ Server Components (SSG/ISR/SEO) ────▶ [Supabase Postgres + RLS + RPC]
   ├─ Route Handlers /api (Node.js) ──────▶ [Supabase Auth/RPC] / [Resend] / [R2]
   └─ Client Components (React) ──────────▶ [Supabase Auth/DB/RPC]
                        └────────────────WS▶ [Supabase Realtime]
                        └───────────────PUT▶ [Cloudflare R2 (upload directo)]`}
            </pre>
          </div>
        </div>
      </div>
    </Section>
  );
}
