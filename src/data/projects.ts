export interface ProjectMetric {
  key: string;
  value: string;
  suffix?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  url?: string;
  github?: string;
  image: string;
  metrics: ProjectMetric[];
  stack: string[];
  featured: boolean;
}

export const fandomsProject: Project = {
  id: "fandoms",
  name: "Fandoms.io",
  tagline: {
    es: "Plataforma social para comunidades de fans",
    en: "Social platform for fan communities",
  },
  description: {
    es: "Diseñé y construí una plataforma social completa para comunidades de fans, llevándola desde concepto hasta producción con más de 32,000 usuarios registrados y 273,000+ interacciones.",
    en: "Designed and built a complete social platform for fan communities, taking it from concept to production with over 32,000 registered users and 273,000+ interactions.",
  },
  url: "https://fandoms.io",
  image: "/images/fandoms-preview.png",
  metrics: [
    { key: "users", value: "32,000", suffix: "+" },
    { key: "posts", value: "4,200", suffix: "+" },
    { key: "comments", value: "41,000", suffix: "+" },
    { key: "interactions", value: "273,000", suffix: "+" },
    { key: "messages", value: "19,000", suffix: "+" },
    { key: "pollVotes", value: "448,000", suffix: "+" },
    { key: "communities", value: "21" },
  ],
  stack: [
    "Next.js 15",
    "React 19",
    "TypeScript",
    "Tailwind CSS",
    "PostgreSQL",
    "Supabase",
    "Vercel",
    "Cloudflare R2",
    "TanStack Query",
    "Zustand",
    "Framer Motion",
  ],
  featured: true,
};

export const codeMetrics = {
  components: "150+",
  hooks: "36",
  endpoints: "20+",
  services: "9",
  tables: "50+",
  policies: "100+",
  lines: "~35,000",
};

export const projects: Project[] = [fandomsProject];

