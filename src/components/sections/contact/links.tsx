import { useTranslations } from "next-intl";
import Link from "next/link";
import { Github, Linkedin, Mail, MapPin, CheckCircle } from "lucide-react";
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
        <div className="grid md:grid-cols-2 gap-8">
          {/* Availability */}
          <div className="p-6 rounded-xl border border-border bg-card/50">
            <h3 className="text-lg font-semibold mb-4">
              {t("availability.title")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                </div>
                <span>{t("availability.status")}</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <MapPin className="h-4 w-4" />
                <span>{t("availability.location")}</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-6 rounded-xl border border-border bg-card/50">
            <h3 className="text-lg font-semibold mb-4">
              {t("links.title")}
            </h3>
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted hover:text-foreground transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.username}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

