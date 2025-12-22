export interface Skill {
  name: string;
  icon: string;
  category: "frontend" | "backend" | "infrastructure" | "tools";
}

export const skills: Skill[] = [
  // Frontend
  { name: "TypeScript", icon: "typescript", category: "frontend" },
  { name: "React 19", icon: "react", category: "frontend" },
  { name: "Next.js 15", icon: "nextjs", category: "frontend" },
  { name: "Tailwind CSS", icon: "tailwind", category: "frontend" },
  { name: "Framer Motion", icon: "framer", category: "frontend" },
  { name: "Zustand", icon: "zustand", category: "frontend" },
  { name: "TanStack Query", icon: "tanstack", category: "frontend" },
  
  // Backend
  { name: "Node.js", icon: "nodejs", category: "backend" },
  { name: "PostgreSQL", icon: "postgresql", category: "backend" },
  { name: "Supabase", icon: "supabase", category: "backend" },
  { name: "REST APIs", icon: "api", category: "backend" },
  { name: "WebSockets", icon: "websocket", category: "backend" },
  
  // Infrastructure
  { name: "Vercel", icon: "vercel", category: "infrastructure" },
  { name: "Cloudflare", icon: "cloudflare", category: "infrastructure" },
  { name: "Docker", icon: "docker", category: "infrastructure" },
  
  // Tools
  { name: "Git", icon: "git", category: "tools" },
  { name: "VS Code", icon: "vscode", category: "tools" },
  { name: "Figma", icon: "figma", category: "tools" },
  { name: "Cursor", icon: "cursor", category: "tools" },
];

export const skillsByCategory = {
  frontend: skills.filter((s) => s.category === "frontend"),
  backend: skills.filter((s) => s.category === "backend"),
  infrastructure: skills.filter((s) => s.category === "infrastructure"),
  tools: skills.filter((s) => s.category === "tools"),
};

