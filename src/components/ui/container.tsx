import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg" | "full";
}

export function Container({
  className,
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        {
          "max-w-4xl": size === "sm",
          "max-w-6xl": size === "default",
          "max-w-7xl": size === "lg",
          "max-w-full": size === "full",
        },
        className
      )}
      {...props}
    />
  );
}

