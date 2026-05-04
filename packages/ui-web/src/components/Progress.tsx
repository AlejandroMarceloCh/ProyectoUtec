type Tone = "brand" | "action" | "success" | "warning" | "danger";

type Props = {
  value: number;
  tone?: Tone;
  label?: string;
  showPercent?: boolean;
  size?: "sm" | "md";
};

const fillByTone: Record<Tone, string> = {
  brand:   "bg-ds-brand-cyan",
  action:  "bg-ds-action",
  success: "bg-ds-success",
  warning: "bg-ds-warning",
  danger:  "bg-ds-danger",
};

const heightBySize = { sm: "h-1.5", md: "h-2.5" };

export function Progress({ value, tone = "brand", label, showPercent, size = "md" }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  return (
    <div className="flex flex-col gap-ds-1">
      {(label || showPercent) ? (
        <div className="flex items-center justify-between">
          {label ? (
            <span className="font-ds-text text-ds-caption uppercase tracking-ds-tight text-ds-fg-mute">
              {label}
            </span>
          ) : <span />}
          {showPercent ? (
            <span className="font-ds-mono text-ds-tiny text-ds-fg-base">{pct}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={`w-full ${heightBySize[size]} bg-ds-bg-raised rounded-ds-pill overflow-hidden`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${heightBySize[size]} ${fillByTone[tone]} rounded-ds-pill transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
