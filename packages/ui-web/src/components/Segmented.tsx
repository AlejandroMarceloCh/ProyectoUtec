type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div role="tablist" className="inline-flex p-ds-1 bg-ds-bg-raised rounded-ds-md border border-ds-line">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`h-9 px-ds-4 rounded-ds-sm font-ds-text font-semibold text-ds-small tracking-ds-tight transition-colors duration-150 ${
              active
                ? "bg-ds-brand-cyan text-ds-fg-on-accent"
                : "bg-transparent text-ds-fg-mute hover:text-ds-fg-base"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
