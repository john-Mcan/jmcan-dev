import { useTranslations } from "next-intl";
import Link from "next/link";
import { Github, Linkedin, Mail, MapPin, ChevronRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { personal } from "@/data/personal";

const socialLinks = [
  {
    name: "GitHub",
    href: personal.social.github,
    icon: Github,
    username: "@johnmcan",
  },
  {
    name: "LinkedIn",
    href: personal.social.linkedin,
    icon: Linkedin,
    username: "johnmcan",
  },
  {
    name: "Email",
    href: `mailto:${personal.email}`,
    icon: Mail,
    username: personal.email,
  },
];

export function ContactLinks() {
  const t = useTranslations("contact");

  return (
    <Section className="bg-card/30">
      <div className="max-w-3xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Availability */}
          <div className="group p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-accent/30 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <h3 className="text-base sm:text-lg font-semibold">
                {t("availability.title")}
              </h3>
            </div>
            
            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                </div>
                <span className="text-sm sm:text-base">{t("availability.status")}</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm sm:text-base">{t("availability.location")}</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="group p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-accent/30 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <h3 className="text-base sm:text-lg font-semibold">
                {t("links.title")}
              </h3>
            </div>
            
            {/* Links */}
            <div className="space-y-2">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex items-center justify-between gap-3 p-2 -mx-2 rounded-lg text-muted hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <link.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base truncate">{link.username}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

