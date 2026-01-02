import { CaseStudyHero } from "@/components/sections/case-study/hero";
import { CaseStudyOverview } from "@/components/sections/case-study/overview";
import { CaseStudyProblem } from "@/components/sections/case-study/problem";
import { CaseStudySolution } from "@/components/sections/case-study/solution";
import { CaseStudyStack } from "@/components/sections/case-study/stack";
import { CaseStudyChallenges } from "@/components/sections/case-study/challenges";
import { CaseStudyMetrics } from "@/components/sections/case-study/metrics";
import { CaseStudyLearnings } from "@/components/sections/case-study/learnings";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 15_552_000;

export const metadata = createPageMetadata({
  title: "Caso de Estudio - Fandoms.io",
  description:
    "Fandoms.io es una plataforma social completa para comunidades de fans, similar a Reddit con funcionalidades de Discord, desarrollada desde cero como proyecto individual.",
  path: "/caso-de-estudio",
  openGraphType: "article",
});

export default function CaseStudyPage() {
  return (
    <>
      <CaseStudyHero />
      <CaseStudyOverview />
      <CaseStudyProblem />
      <CaseStudySolution />
      <CaseStudyStack />
      <CaseStudyChallenges />
      <CaseStudyMetrics />
      <CaseStudyLearnings />
    </>
  );
}
