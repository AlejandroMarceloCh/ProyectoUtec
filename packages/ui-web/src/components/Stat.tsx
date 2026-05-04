import { ReactNode } from "react";
import { Card } from "./Card";

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon?: ReactNode;
  emphasis?: "neutral" | "brand" | "action";
};

const trendColor = { up: "text-ds-success", down: "text-ds-danger", flat: "text-ds-fg-mute" };
const trendArrow = { up: "▲", down: "▼", flat: "—" };
const valueColor = { neutral: "text-ds-fg-hi", brand: "text-ds-brand-cyan", action: "text-ds-action" };

export function Stat({ label, value, unit, hint, trend, icon, emphasis = "neutral" }: Props) {
  return (
    <Card variant="surface" className="flex flex-col gap-ds-2">
      <div className="flex items-center justify-between">
        <span className="font-ds-text text-ds-caption uppercase tracking-ds-tight text-ds-fg-mute">
          {label}
        </span>
        {icon}
      </div>
      <div className="flex items-baseline gap-ds-1">
        <span className={`font-ds-display text-ds-h2 tracking-ds-tight ${valueColor[emphasis]}`}>
          {value}
        </span>
        {unit ? <span className="font-ds-text text-ds-body text-ds-fg-mute">{unit}</span> : null}
      </div>
      {trend ? (
        <div className="flex items-center gap-ds-1">
          <span className={`font-ds-mono text-ds-tiny ${trendColor[trend.direction]}`}>
            {trendArrow[trend.direction]} {trend.value}
          </span>
          {hint ? <span className="font-ds-text text-ds-tiny text-ds-fg-dim">· {hint}</span> : null}
        </div>
      ) : hint ? (
        <span className="font-ds-text text-ds-tiny text-ds-fg-dim">{hint}</span>
      ) : null}
    </Card>
  );
}
