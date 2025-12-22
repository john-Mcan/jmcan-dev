import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export function ContactHero() {
  const t = useTranslations("contact");

  return (
    <section className="relative pt-28 pb-20 sm:pt-32 md:pt-36 md:pb-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="gradient-blur gradient-blur-accent top-0 left-1/4" />

      <Container className="relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            {t("title")}
          </h1>
          <p className="text-xl text-muted">
            {t("subtitle")}
          </p>
        </div>
      </Container>
    </section>
  );
}

