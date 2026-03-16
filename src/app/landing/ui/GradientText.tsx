import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
}

export function GradientText({
  children,
  className,
  as: Tag = "span",
}: GradientTextProps) {
  return (
    <Tag className={cn("text-gradient-ocean text-glow", className)}>
      {children}
    </Tag>
  );
}
