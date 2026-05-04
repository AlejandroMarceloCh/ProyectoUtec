import { InputHTMLAttributes, ReactNode, useId } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Input({ label, hint, error, leftIcon, rightIcon, className = "", id, ...rest }: Props) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const hasError = !!error;
  return (
    <div className="flex flex-col gap-ds-1">
      {label ? (
        <label
          htmlFor={inputId}
          className="font-ds-text text-ds-tiny uppercase tracking-ds-tight text-ds-fg-mute"
        >
          {label}
        </label>
      ) : null}
      <div
        className={`flex items-center gap-ds-2 px-ds-3 h-12 rounded-ds-md bg-ds-bg-raised border transition-colors duration-150 ${
          hasError
            ? "border-ds-danger"
            : "border-ds-line focus-within:border-ds-brand-cyan focus-within:shadow-ds-glow"
        }`}
      >
        {leftIcon}
        <input
          id={inputId}
          className={`flex-1 bg-transparent outline-none font-ds-text text-ds-body text-ds-fg-hi placeholder:text-ds-fg-dim ${className}`}
          {...rest}
        />
        {rightIcon}
      </div>
      {error ? (
        <span className="font-ds-text text-ds-tiny text-ds-danger">{error}</span>
      ) : hint ? (
        <span className="font-ds-text text-ds-tiny text-ds-fg-dim">{hint}</span>
      ) : null}
    </div>
  );
}
