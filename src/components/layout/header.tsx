"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { cn } from "@/lib/utils";

const navigation = [
  { key: "home", href: "/" },
  { key: "caseStudy", href: "/caso-de-estudio" },
  { key: "contact", href: "/contacto" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      // Cerrar menú al hacer scroll
      if (isMobileMenuOpen && window.scrollY > 50) {
        closeMobileMenu();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border-b border-border"
            : "bg-transparent"
        )}
      >
        <Container>
          <nav className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="text-lg font-bold tracking-tight transition-colors hover:text-accent"
            >
              johnmcan<span className="text-accent">.dev</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-muted transition-colors",
                    "hover:text-foreground rounded-lg hover:bg-secondary/50"
                  )}
                >
                  {t(item.key)}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  "md:hidden relative flex h-10 w-10 items-center justify-center rounded-lg border border-border",
                  "bg-secondary/50 transition-all duration-200 hover:bg-secondary",
                  isMobileMenuOpen && "bg-secondary"
                )}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className={cn(
                  "absolute transition-all duration-200",
                  isMobileMenuOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                )}>
                  <Menu className="h-5 w-5" />
                </span>
                <span className={cn(
                  "absolute transition-all duration-200",
                  isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                )}>
                  <X className="h-5 w-5" />
                </span>
              </button>
            </div>
          </nav>
        </Container>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          isMobileMenuOpen
            ? "pointer-events-auto"
            : "pointer-events-none"
        )}
      >
        {/* Backdrop - blur aplicado gradualmente con pseudo-elemento */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-300 ease-out",
            isMobileMenuOpen 
              ? "bg-background/70 backdrop-blur-md" 
              : "bg-transparent backdrop-blur-none"
          )}
          style={{
            transitionProperty: "background-color, backdrop-filter",
          }}
          onClick={closeMobileMenu}
        />

        {/* Menu Panel */}
        <div
          className={cn(
            "absolute top-16 left-0 right-0 bg-background border-b border-border",
            "transition-all duration-300 ease-out",
            isMobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          )}
        >
          <Container>
            <div className="py-4">
              {/* Navigation Links */}
              <nav className="flex flex-col">
                {navigation.map((item, index) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "group flex items-center justify-between px-4 py-4 rounded-xl",
                      "text-base font-medium text-foreground",
                      "transition-all duration-200",
                      "hover:bg-secondary active:bg-secondary/80",
                      "border-b border-border last:border-b-0"
                    )}
                    style={{
                      animationDelay: isMobileMenuOpen ? `${index * 50}ms` : "0ms",
                    }}
                  >
                    <span>{t(item.key)}</span>
                    <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                  </Link>
                ))}
              </nav>

              {/* Mobile Actions */}
              <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border sm:hidden">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}

