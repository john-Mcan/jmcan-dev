"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { fandomsProject } from "@/data/projects";

export function CaseStudyHero() {
  const t = useTranslations("caseStudy");
  const project = fandomsProject;

  return (
    <section className="relative pt-28 pb-20 sm:pt-32 md:pb-32 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="gradient-blur gradient-blur-accent top-0 right-1/4" />

      <Container className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("title")}</span>
        </Link>

        <div className="max-w-3xl">
          <p className="text-accent font-medium mb-4">{t("title")}</p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            {project.name}
          </h1>

          <p className="text-xl md:text-2xl text-muted mb-8">
            {t("subtitle")}
          </p>

          {project.url && (
            <Button asChild variant="outline" size="lg">
              <Link
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Visitar Proyecto
              </Link>
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
}
