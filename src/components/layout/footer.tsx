"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { personal } from "@/data/personal";

const socialLinks = [
  { name: "GitHub", href: personal.social.github, icon: Github },
  { name: "LinkedIn", href: personal.social.linkedin, icon: Linkedin },
  { name: "Email", href: `mailto:${personal.email}`, icon: Mail },
];

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50">
      <Container>
        <div className="py-8 md:py-6">
          <div className="flex flex-col items-center gap-6 md:hidden">
            <div className="flex items-center gap-1">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-all duration-200 hover:text-foreground hover:bg-secondary active:scale-95"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted">
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

            <div className="flex flex-col items-center gap-1 text-sm text-muted">
              <span>{currentYear} {personal.name}</span>
              <span>{t("rights")}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>{currentYear} {personal.name}.</span>
              <span>{t("rights")}.</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted">
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

            <div className="flex items-center gap-1">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-all duration-200 hover:text-foreground hover:bg-secondary"
                  aria-label={link.name}
                >
                  <link.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
