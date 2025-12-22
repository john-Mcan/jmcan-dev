import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Skills } from "@/components/sections/skills";
import { ProjectHighlight } from "@/components/sections/project-highlight";

export const revalidate = 15552000;

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <ProjectHighlight />
    </>
  );
}
