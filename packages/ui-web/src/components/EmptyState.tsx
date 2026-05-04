import { ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void; variant?: "primary" | "brand" | "ghost" };
};

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-ds-4 px-ds-6 py-ds-8 text-center">
      {icon ? <div className="opacity-60">{icon}</div> : null}
      <div className="flex flex-col gap-ds-2 items-center">
        <h2 className="font-ds-display text-ds-h4 text-ds-fg-hi tracking-ds-tight">{title}</h2>
        {description ? (
          <p className="font-ds-text text-ds-body text-ds-fg-mute max-w-md">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button variant={action.variant ?? "ghost"} onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
