"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, FileCode } from "lucide-react";
import { useAppTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { DarkVeil } from "@/components/ui/dark-veil";

export function Hero() {
  const t = useTranslations("hero");
  const { theme } = useAppTheme();
  const isLight = theme === "light";

  return (
    <section className="relative min-h-[90vh] min-h-[90dvh] flex items-center justify-center overflow-hidden">
      {/* DarkVeil Background */}
      <div className="absolute inset-0">
        <DarkVeil 
          speed={1} 
          hueShift={26} 
          warpAmount={1} 
          resolutionScale={0.85}
          invert={isLight}
        />
      </div>
      {/* Overlay for better text readability */}
      <div className={`absolute inset-0 ${isLight ? "bg-white/30" : "bg-background/40"}`} />

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Greeting */}
          <p className="text-muted text-lg mb-4 animate-fade-in opacity-0">
            {t("greeting")}
          </p>

          {/* Name */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 animate-fade-in-up opacity-0 stagger-1">
            {t("name")}
          </h1>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-accent mb-6 animate-fade-in-up opacity-0 stagger-2">
            {t("title")}
          </h2>

          {/* Description */}
          <p className="text-muted text-base md:text-lg max-w-2xl mx-auto mb-10 text-balance animate-fade-in-up opacity-0 stagger-3">
            {t("description")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in-up opacity-0 stagger-4 w-full sm:w-auto">
            <Button asChild size="lg" className="group w-full sm:w-auto">
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

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted rounded-full" />
        </div>
      </div>
    </section>
  );
}
