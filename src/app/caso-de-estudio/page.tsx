import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CaseStudyHero } from "@/components/sections/case-study/hero";
import { CaseStudyOverview } from "@/components/sections/case-study/overview";
import { CaseStudyProblem } from "@/components/sections/case-study/problem";
import { CaseStudySolution } from "@/components/sections/case-study/solution";
import { CaseStudyStack } from "@/components/sections/case-study/stack";
import { CaseStudyChallenges } from "@/components/sections/case-study/challenges";
import { CaseStudyMetrics } from "@/components/sections/case-study/metrics";
import { CaseStudyLearnings } from "@/components/sections/case-study/learnings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("caseStudy");
  
  return {
    title: `${t("title")} - Fandoms.io`,
    description: t("overview.description"),
  };
}

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

