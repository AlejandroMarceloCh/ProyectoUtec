/** UTEC GYM — Tailwind preset compartido (web)
 *  Usado por reception/ y scanner/ vía `presets: [require('@utec-gym/ui-web/tailwind.preset.cjs')]`.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Surfaces
        "ds-bg-base":     "#0A0B0D",
        "ds-bg-surface":  "#101115",
        "ds-bg-raised":   "#181A20",
        "ds-bg-sunken":   "#06070A",
        "ds-line":        "#23262E",
        "ds-line-muted":  "#1A1C22",
        // Foreground
        "ds-fg-hi":       "#F4F5F7",
        "ds-fg-base":     "#D6D8DD",
        "ds-fg-mute":     "#9AA0AB",
        "ds-fg-dim":      "#6B7280",
        "ds-fg-on-accent":"#0A0B0D",
        // Brand
        "ds-brand-cyan":      "#22D3EE",
        "ds-brand-cyan-dim":  "#0E7490",
        "ds-brand-cyan-glow": "rgba(34,211,238,0.14)",
        // Action
        "ds-action":       "#D4FF3F",
        "ds-action-hover": "#C2F032",
        "ds-action-press": "#A6D026",
        "ds-action-ghost": "rgba(212,255,63,0.10)",
        // Semánticos
        "ds-success":    "#5EEAA0",
        "ds-success-bg": "rgba(94,234,160,0.10)",
        "ds-warning":    "#FFB454",
        "ds-warning-bg": "rgba(255,180,84,0.12)",
        "ds-danger":     "#FF6464",
        "ds-danger-bg":  "rgba(255,100,100,0.12)",
        "ds-info":       "#22D3EE",
        "ds-info-bg":    "rgba(34,211,238,0.10)",
        // Facultades
        "ds-fac-SI":   "#22D3EE",
        "ds-fac-BIO":  "#5EEAA0",
        "ds-fac-ELE":  "#FFB454",
        "ds-fac-QUI":  "#FF8AB1",
        "ds-fac-BA":   "#D4FF3F",
        "ds-fac-CDIA": "#B794F6",
        "ds-fac-AND":  "#FF6464",
        "ds-fac-MEC":  "#7DD3FC",
        "ds-fac-ENE":  "#FBA74A",
        "ds-fac-AMB":  "#9AE6B4",
        "ds-fac-CIV":  "#A78BFA",
        "ds-fac-MEC2": "#60A5FA",
        "ds-fac-IND":  "#F687B3",
      },
      fontFamily: {
        "ds-display": ['"Space Grotesk"', "system-ui", "sans-serif"],
        "ds-text":    ['"Inter Tight"', "system-ui", "-apple-system", "sans-serif"],
        "ds-mono":    ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Web: títulos ×1.25 vs móvil. Body queda igual a móvil.
        "ds-caption": "11px",
        "ds-tiny":    "12px",
        "ds-small":   "13px",
        "ds-body":    "15px",
        "ds-lead":    "18px",
        "ds-h6":      "20px",
        "ds-h5":      "24px",
        "ds-h4":      "30px",
        "ds-h3":      "36px",
        "ds-h2":      "44px",
        "ds-h1":      "56px",
        "ds-display": "72px",
      },
      letterSpacing: {
        "ds-tight": "-0.01em",
      },
      borderRadius: {
        "ds-sm":   "6px",
        "ds-md":   "10px",
        "ds-lg":   "14px",
        "ds-xl":   "20px",
        "ds-pill": "999px",
      },
      spacing: {
        "ds-1":  "4px",  "ds-2":  "8px",  "ds-3":  "12px", "ds-4": "16px",
        "ds-5":  "20px", "ds-6":  "24px", "ds-7":  "32px", "ds-8": "40px",
        "ds-9":  "48px", "ds-10": "64px", "ds-11": "80px", "ds-12":"96px",
      },
      boxShadow: {
        "ds-sm":   "0 1px 2px rgba(0,0,0,.4)",
        "ds-md":   "0 4px 16px rgba(0,0,0,.45)",
        "ds-lg":   "0 12px 40px rgba(0,0,0,.55)",
        "ds-glow": "0 0 0 1px rgba(34,211,238,.35), 0 0 20px rgba(34,211,238,.18)",
      },
      transitionTimingFunction: {
        "ds-out": "cubic-bezier(.2,.8,.2,1)",
        "ds-spring": "cubic-bezier(.34,1.56,.64,1)",
      },
    },
  },
  safelist: [],
  plugins: [],
};
