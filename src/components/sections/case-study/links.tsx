"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ExternalLink, Github, ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { fandomsProject } from "@/data/projects";

export function CaseStudyLinks() {
  const t = useTranslations("caseStudy.links");
  const tContact = useTranslations("contact");
  const project = fandomsProject;

  return (
    <Section className="bg-card/30">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">{t("title")}</h2>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {project.url && (
            <Button asChild variant="outline" size="lg" className="w-full justify-center">
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t("demo")}
              </a>
            </Button>
          )}

          <Button asChild variant="outline" size="lg" className="w-full justify-center">
            <Link href="/contacto">
              <Github className="h-4 w-4" />
              {t("repoNote")}
            </Link>
          </Button>

          <Button asChild variant="default" size="lg" className="group w-full justify-center">
            <Link href="/contacto">
              <span>{tContact("title")}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

