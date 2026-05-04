import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "brand" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
};

const containerByVariant: Record<Variant, string> = {
  primary: "bg-ds-action hover:bg-ds-action-hover active:bg-ds-action-press text-ds-fg-on-accent",
  brand:   "bg-ds-brand-cyan hover:opacity-90 active:bg-ds-brand-cyan-dim text-ds-fg-on-accent shadow-ds-glow",
  ghost:   "bg-transparent border border-ds-line hover:bg-ds-bg-raised text-ds-fg-hi",
  danger:  "bg-ds-danger hover:opacity-90 text-ds-fg-hi",
};

const sizeContainer: Record<Size, string> = {
  sm: "h-9 px-ds-3 rounded-ds-md text-ds-small",
  md: "h-11 px-ds-5 rounded-ds-md text-ds-body",
  lg: "h-14 px-ds-6 rounded-ds-lg text-ds-lead",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  fullWidth,
  className = "",
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-ds-2 font-ds-text font-semibold tracking-ds-tight transition-all duration-200 ${sizeContainer[size]} ${containerByVariant[variant]} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="animate-pulse">…</span>
      ) : (
        <>
          {leftIcon}
          <span>{children}</span>
          {rightIcon}
        </>
      )}
    </button>
  );
}
