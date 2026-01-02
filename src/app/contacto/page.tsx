import { ContactHero } from "@/components/sections/contact/hero";
import { ContactForm } from "@/components/sections/contact/form";
import { ContactLinks } from "@/components/sections/contact/links";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 15_552_000;

export const metadata = createPageMetadata({
  title: "Contacto",
  description:
    "¿Interesado en trabajar juntos? Envíame un mensaje y conversemos sobre cómo puedo aportar como Desarrollador Full Stack.",
  path: "/contacto",
});

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactForm />
      <ContactLinks />
    </>
  );
}
