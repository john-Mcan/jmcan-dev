import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactHero } from "@/components/sections/contact/hero";
import { ContactForm } from "@/components/sections/contact/form";
import { ContactLinks } from "@/components/sections/contact/links";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactForm />
      <ContactLinks />
    </>
  );
}

