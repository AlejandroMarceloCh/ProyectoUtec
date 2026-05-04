import { HTMLAttributes, ReactNode } from "react";

type Variant = "surface" | "raised" | "brand" | "sunken";

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  glow?: boolean;
  children: ReactNode;
};

const bgByVariant: Record<Variant, string> = {
  surface: "bg-ds-bg-surface border border-ds-line",
  raised:  "bg-ds-bg-raised border border-ds-line",
  brand:   "bg-ds-bg-surface border border-ds-brand-cyan",
  sunken:  "bg-ds-bg-sunken border border-ds-line-muted",
};

export function Card({ variant = "surface", glow = false, children, className = "", ...rest }: Props) {
  return (
    <div
      className={`p-ds-5 rounded-ds-lg ${bgByVariant[variant]} ${glow ? "shadow-ds-glow" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
