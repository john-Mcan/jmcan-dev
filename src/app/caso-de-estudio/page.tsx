import { CaseStudyHero } from "@/components/sections/case-study/hero";
import { CaseStudyOverview } from "@/components/sections/case-study/overview";
import { CaseStudyRoleScope } from "@/components/sections/case-study/role-scope";
import { CaseStudyArchitecture } from "@/components/sections/case-study/architecture";
import { CaseStudySolution } from "@/components/sections/case-study/solution";
import { CaseStudyDecisions } from "@/components/sections/case-study/decisions";
import { CaseStudyStack } from "@/components/sections/case-study/stack";
import { CaseStudyChallenges } from "@/components/sections/case-study/challenges";
import { CaseStudyMetrics } from "@/components/sections/case-study/metrics";
import { CaseStudyTradeOffs } from "@/components/sections/case-study/trade-offs";
import { CaseStudyLearnings } from "@/components/sections/case-study/learnings";
import { CaseStudyLinks } from "@/components/sections/case-study/links";
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
      {/* Hero + Links */}
      <CaseStudyHero />
      
      {/* Context: Project Overview */}
      <CaseStudyOverview />
      
      {/* Role & Scope */}
      <CaseStudyRoleScope />
      
      {/* Architecture */}
      <CaseStudyArchitecture />
      
      {/* Core Features */}
      <CaseStudySolution />
      
      {/* Technical Decisions */}
      <CaseStudyDecisions />
      
      {/* Tech Stack */}
      <CaseStudyStack />
      
      {/* Technical Challenges */}
      <CaseStudyChallenges />
      
      {/* Code Metrics */}
      <CaseStudyMetrics />
      
      {/* Trade-offs & Future Improvements */}
      <CaseStudyTradeOffs />
      
      {/* Key Learnings */}
      <CaseStudyLearnings />
      
      {/* Links + CTA */}
      <CaseStudyLinks />
    </>
  );
}
