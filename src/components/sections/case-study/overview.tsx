import { useTranslations } from "next-intl";
import { Users, MessageSquare, ThumbsUp, BarChart3, MessagesSquare, Vote } from "lucide-react";
import { Section } from "@/components/ui/section";
import { fandomsProject } from "@/data/projects";

const metricIcons: Record<string, React.ElementType> = {
  users: Users,
  posts: MessageSquare,
  comments: MessagesSquare,
  interactions: ThumbsUp,
  messages: MessageSquare,
  pollVotes: Vote,
  communities: Users,
};

export function CaseStudyOverview() {
  const t = useTranslations("caseStudy");
  const tMetrics = useTranslations("project.metrics");
  const project = fandomsProject;

  return (
    <Section className="bg-card/30">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <h2 className="text-3xl font-bold mb-6">{t("overview.title")}</h2>
          <p className="text-lg text-muted leading-relaxed">
            {t("overview.description")}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {project.metrics.map((metric) => {
            const Icon = metricIcons[metric.key] || BarChart3;
            return (
              <div
                key={metric.key}
                className="p-4 rounded-xl border border-border bg-card/50 text-center"
              >
                <Icon className="h-5 w-5 text-accent mx-auto mb-2" />
                <div className="text-xl font-bold">
                  {metric.value}
                  {metric.suffix && (
                    <span className="text-accent">{metric.suffix}</span>
                  )}
                </div>
                <div className="text-xs text-muted">{tMetrics(metric.key)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

