import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

type HeroDecoration = "grid" | "none";
type AccentBlur = "left" | "right" | "none";

interface PageHeroProps extends React.HTMLAttributes<HTMLElement> {
  containerSize?: "default" | "sm" | "lg" | "full";
  decoration?: HeroDecoration;
  accentBlur?: AccentBlur;
}

export function PageHero({
  className,
  containerSize = "default",
  decoration = "grid",
  accentBlur = "none",
  children,
  ...props
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "pt-28 pb-20 sm:pt-32 md:pt-36 md:pb-32",
        className
      )}
      {...props}
    >
      {decoration === "grid" && (
        <div className="absolute inset-0 grid-pattern opacity-20" aria-hidden="true" />
      )}

      {accentBlur !== "none" && (
        <div
          className={cn(
            "gradient-blur gradient-blur-accent top-0",
            accentBlur === "left" && "left-1/4",
            accentBlur === "right" && "right-1/4"
          )}
          aria-hidden="true"
        />
      )}

      <Container size={containerSize} className="relative z-10">
        {children}
      </Container>
    </section>
  );
}


