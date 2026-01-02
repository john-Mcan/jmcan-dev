import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section
      className="fixed inset-0 z-10 bg-background pt-[var(--header-offset)] pb-24 sm:pb-32 flex items-center justify-center"
      aria-label="Página no encontrada"
    >
      <Container size="sm" className="text-center">
        <p className="text-muted text-xs sm:text-sm tracking-[0.25em] uppercase">
          Error 404
        </p>

        <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          Página no encontrada
        </h1>

        <p className="mt-4 text-muted text-base sm:text-lg text-balance">
          La URL que intentas visitar no existe o fue movida.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/contacto">Contactar</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}


