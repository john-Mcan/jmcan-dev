"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, ExternalLink, Users, MessageSquare, ThumbsUp, BarChart3 } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fandomsProject } from "@/data/projects";

const metricIcons: Record<string, React.ElementType> = {
  users: Users,
  posts: MessageSquare,
  comments: MessageSquare,
  interactions: ThumbsUp,
  messages: MessageSquare,
  pollVotes: BarChart3,
  communities: Users,
};

export function ProjectHighlight() {
  const t = useTranslations("project");
  const project = fandomsProject;
  const displayMetrics = project.metrics.slice(0, 4);

  return (
    <Section className="bg-card/30">
      <SectionHeader title={t("title")} centered />

      <Card className="overflow-hidden hover:border-accent/50 transition-colors">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl sm:text-3xl font-bold">
                  {project.name}
                </h3>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-accent transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                )}
              </div>

              <p className="text-accent font-medium mb-4">
                {t("fandoms.tagline")}
              </p>

              <p className="text-muted mb-6 leading-relaxed">
                {t("fandoms.description")}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {project.stack.slice(0, 6).map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
                {project.stack.length > 6 && (
                  <Badge variant="secondary">
                    +{project.stack.length - 6}
                  </Badge>
                )}
              </div>

              <Button asChild className="w-full sm:w-fit group">
                <Link href="/caso-de-estudio">
                  <span>{t("fandoms.cta")}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <div className="bg-secondary/30 p-8 lg:p-12 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-6">
                {displayMetrics.map((metric) => {
                  const Icon = metricIcons[metric.key] || BarChart3;
                  return (
                    <div key={metric.key} className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-3">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold">
                        {metric.value}
                        {metric.suffix && (
                          <span className="text-accent">{metric.suffix}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted">
                        {t(`metrics.${metric.key}`)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}

