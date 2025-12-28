"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, FileCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type DarkVeilProps = {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  speed?: number;
  scanlineFrequency?: number;
  warpAmount?: number;
  resolutionScale?: number;
  invert?: boolean;
};

type DarkVeilModule = typeof import("@/components/ui/dark-veil");
let darkVeilPromise: Promise<DarkVeilModule> | null = null;

function preloadDarkVeil() {
  if (!darkVeilPromise) {
    darkVeilPromise = import("@/components/ui/dark-veil");
  }
  return darkVeilPromise;
}

// Precarga ASAP en cliente para reducir el tiempo en fallback.
if (typeof window !== "undefined") {
  void preloadDarkVeil();
}

const DarkVeil = dynamic<DarkVeilProps>(
  () => preloadDarkVeil().then((m) => m.DarkVeil),
  {
    ssr: false,
    loading: () => null,
  }
);

export function Hero() {
  const t = useTranslations("hero");
  const { theme } = useAppTheme();
  const isLight = theme === "light";
  const [isVeilReady, setIsVeilReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    preloadDarkVeil()
      .then(() => {
        // Deja al menos un frame para que React pinte el componente dinámico
        // antes de empezar el crossfade del fallback.
        requestAnimationFrame(() => {
          if (!cancelled) setIsVeilReady(true);
        });
      })
      .catch(() => {
        // Si falla, mantenemos el fallback (negro) sin romper la UI.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative min-h-[90vh] min-h-[90dvh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Fallback (negro) + crossfade rápido para evitar “pestañeo” */}
        <div
          className={cn(
            "absolute inset-0 z-10 bg-black",
            "transition-opacity duration-200 ease-out motion-reduce:transition-none",
            isVeilReady ? "opacity-0" : "opacity-100"
          )}
        />
        <div
          className={cn(
            "absolute inset-0 z-0",
            "transition-opacity duration-900 ease-out motion-reduce:transition-none",
            isVeilReady ? "opacity-100" : "opacity-0"
          )}
        >
          <DarkVeil
            speed={1}
            hueShift={26}
            warpAmount={1}
            resolutionScale={0.85}
            invert={isLight}
          />
        </div>
      </div>
      <div className={`absolute inset-0 ${isLight ? "bg-white/30" : "bg-background/40"}`} />

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-muted text-lg mb-4 animate-fade-in opacity-0">
            {t("greeting")}
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            {t("name")}
          </h1>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-accent mb-6 animate-fade-in-up opacity-0 stagger-2">
            {t("title")}
          </h2>

          <p className="text-muted text-base md:text-lg max-w-2xl mx-auto mb-10 text-balance animate-fade-in-up opacity-0 stagger-3">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in-up opacity-0 stagger-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="group w-full sm:w-auto border-2 border-transparent"
            >
              <Link href="/caso-de-estudio">
                <FileCode className="h-5 w-5" />
                <span>{t("cta.projects")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/contacto">
                {t("cta.contact")}
              </Link>
            </Button>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted rounded-full" />
        </div>
      </div>
    </section>
  );
}
