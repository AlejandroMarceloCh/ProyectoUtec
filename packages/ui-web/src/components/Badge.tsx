import { ReactNode } from "react";

type Tone = "neutral" | "brand" | "action" | "success" | "warning" | "danger" | "info";

type Props = {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
};

const styles: Record<Tone, string> = {
  neutral: "bg-ds-bg-raised text-ds-fg-base border-ds-line",
  brand:   "bg-ds-brand-cyan-glow text-ds-brand-cyan border-ds-brand-cyan-dim",
  action:  "bg-ds-action-ghost text-ds-action border-ds-action",
  success: "bg-ds-success-bg text-ds-success border-ds-success",
  warning: "bg-ds-warning-bg text-ds-warning border-ds-warning",
  danger:  "bg-ds-danger-bg text-ds-danger border-ds-danger",
  info:    "bg-ds-info-bg text-ds-info border-ds-info",
};

export function Badge({ tone = "neutral", children, icon }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-ds-1 px-ds-2 h-6 rounded-ds-pill border font-ds-text text-ds-caption uppercase tracking-ds-tight ${styles[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
