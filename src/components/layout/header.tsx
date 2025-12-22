"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, ChevronRight, Home, Briefcase, Mail } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { cn } from "@/lib/utils";

const navigation = [
  { key: "home", href: "/", icon: Home },
  { key: "caseStudy", href: "/caso-de-estudio", icon: Briefcase },
  { key: "contact", href: "/contacto", icon: Mail },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper para determinar si un link está activo
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname === "/es" || pathname === "/en";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
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
      {/* Header unificado: Navbar flotante con tarjeta */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="pt-3 px-4 sm:pt-4 sm:px-4 lg:px-8">
          {/* Tarjeta del navbar */}
          <nav 
            className={cn(
              "mx-auto max-w-5xl rounded-2xl border border-border/50",
              "bg-background/30 backdrop-blur-md",
              "shadow-sm"
            )}
          >
            <div className="flex h-14 sm:h-16 items-center justify-between gap-3 px-4 sm:px-4 lg:px-6">
              
              {/* Left: Logo */}
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={cn(
                  "inline-flex items-center text-base sm:text-lg font-bold tracking-tight",
                  "transition-all duration-200",
                  "hover:text-accent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "rounded-md"
                )}
              >
                johnmcan<span className="text-accent">.dev</span>
              </Link>

              {/* Right: Navigation + Actions */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Navigation Links - Hidden on mobile */}
                <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Navegación principal">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        title={t(item.key)}
                        className={cn(
                          "px-2 lg:px-4 py-2 text-sm font-medium rounded-lg",
                          "transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                          isActive(item.href)
                            ? "text-accent bg-accent/10"
                            : "text-muted hover:text-foreground hover:bg-secondary/60"
                        )}
                      >
                        {/* Icono para tamaños < lg */}
                        <Icon className="w-4 h-4 lg:hidden" />
                        {/* Texto para tamaños >= lg */}
                        <span className="hidden lg:inline">{t(item.key)}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Actions - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={cn(
                    "md:hidden relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border",
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
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className={cn(
                    "absolute transition-all duration-200",
                    isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                  )}>
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </div>
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
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-background/70 backdrop-blur-sm",
            "transition-opacity duration-300 ease-out",
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMobileMenu}
        />

        {/* Menu Panel - Aparece debajo del header */}
        <div
          className={cn(
            "absolute top-[76px] sm:top-[92px] left-4 right-4 sm:left-4 sm:right-4",
            "bg-background/95 backdrop-blur-md rounded-2xl border border-border/50",
            "shadow-lg",
            "transition-all duration-300 ease-out",
            isMobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <div className="p-2">
            {/* Navigation Links */}
            <nav className="flex flex-col">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "group flex items-center justify-between px-4 py-3 rounded-xl",
                      "text-base font-medium",
                      "transition-all duration-200",
                      isActive(item.href)
                        ? "text-accent bg-accent/10"
                        : "text-foreground hover:bg-secondary active:bg-secondary/80"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive(item.href) ? "text-accent" : "text-muted"
                      )} />
                      <span>{t(item.key)}</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-all group-hover:translate-x-1",
                      isActive(item.href) ? "text-accent" : "text-muted group-hover:text-accent"
                    )} />
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Actions */}
            <div className="flex items-center justify-center gap-3 mt-2 pt-3 border-t border-border/50">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
