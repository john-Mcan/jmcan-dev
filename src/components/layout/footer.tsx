import { useTranslations } from "next-intl";
import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { personal } from "@/data/personal";

const socialLinks = [
  {
    name: "GitHub",
    href: personal.social.github,
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: personal.social.linkedin,
    icon: Linkedin,
  },
  {
    name: "Email",
    href: `mailto:${personal.email}`,
    icon: Mail,
  },
];

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8">
          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>© {currentYear} {personal.name}.</span>
            <span>{t("rights")}.</span>
          </div>

          {/* Built with */}
          <div className="flex items-center gap-1 text-sm text-muted">
            <span>{t("builtWith")}</span>
            <Link
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-accent transition-colors"
            >
              Next.js
            </Link>
            <span>&</span>
            <Link
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-accent transition-colors"
            >
              Vercel
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socialLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground hover:bg-secondary"
                aria-label={link.name}
              >
                <link.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

