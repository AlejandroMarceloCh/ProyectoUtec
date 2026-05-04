import { ReactNode, MouseEventHandler } from "react";

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

export function ListItem({ title, subtitle, meta, leading, trailing, onClick }: Props) {
  const interactive = !!onClick;
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") (onClick as any)(e); } : undefined}
      className={`flex items-center gap-ds-3 px-ds-4 min-h-[56px] bg-ds-bg-surface border-b border-ds-line-muted ${
        interactive ? "cursor-pointer hover:bg-ds-bg-raised" : ""
      }`}
    >
      {leading}
      <div className="flex-1 flex flex-col gap-ds-1 py-ds-2 min-w-0">
        <span className="font-ds-text font-semibold text-ds-body text-ds-fg-hi truncate">{title}</span>
        {subtitle ? (
          <span className="font-ds-text text-ds-small text-ds-fg-mute truncate">{subtitle}</span>
        ) : null}
      </div>
      {meta ? <span className="font-ds-mono text-ds-tiny text-ds-fg-dim">{meta}</span> : null}
      {trailing}
    </div>
  );
}
