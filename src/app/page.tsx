import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Skills } from "@/components/sections/skills";
import { ProjectHighlight } from "@/components/sections/project-highlight";

// Contenido estático: cache largo en Edge (ISR). 6 meses (en segundos).
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
