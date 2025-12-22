import type { Metadata } from "next";
import { ContactHero } from "@/components/sections/contact/hero";
import { ContactForm } from "@/components/sections/contact/form";
import { ContactLinks } from "@/components/sections/contact/links";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Estoy buscando oportunidades donde pueda aportar soluciones técnicas sólidas mientras continúo aprendiendo de desarrolladores más experimentados.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactForm />
      <ContactLinks />
    </>
  );
}

