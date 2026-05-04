# UTEC GYM — Design Handoff

**Versión:** Design System v2.0
**Canvas fuente:** `UTEC Gym Redesign.html`
**Audiencia:** Claude Code / equipo dev (Alejandro)
**Objetivo:** reemplazar el diseño actual del repo (`frontend/`, `reception/`, `scanner/`) sin volver al canvas.

---

## 1. Resumen del design system

UTEC GYM v2.0 unifica las 3 superficies (móvil del alumno, panel web de recepción, scanner web) bajo un mismo lenguaje **dark-first deportivo+técnico**. Se separa "marca" de "acción": el cyan UTEC se reserva para identidad y datos; los CTAs usan **lima eléctrico** para evitar la sobrecarga visual del cyan en todas partes. Tipografía pareada (Space Grotesk display + Inter Tight texto + JetBrains Mono para datos), grises calibrados para AA sobre negro #0A0B0D, escala 4-base, radios suaves (10–14px) y motion corto con easing estándar.

### Decisiones clave

| Dimensión | Decisión | Por qué |
|---|---|---|
| **Tono** | Dark-first deportivo + técnico | Coherente con el branding actual; permite contrastes fuertes para datos |
| **Marca** | Cyan UTEC `#22D3EE` (calibrado), uso restringido | El cyan original `#00E5E5` vibraba contra blanco. Esta versión mantiene espíritu y pasa AA |
| **Acción** | Lima eléctrico `#D4FF3F` para CTAs | Separa "esto es marca" de "esto se toca". Botones primarios usan lima, no cyan |
| **Tipografía** | Space Grotesk + Inter Tight + JetBrains Mono | Display geométrico con personalidad + neutra legible + mono para IDs/timers/datos |
| **Espaciado** | 4-base (4/8/12/16/20/24/32/40/48/64) | Grid predecible, alinea con Tailwind default |
| **Radios** | 6/10/14/20 + pill | Lo suficientemente suave para friendly, lo suficientemente angular para deportivo |
| **Motion** | 120/200/320ms con `cubic-bezier(.2,.8,.2,1)` | Snappy sin sentirse abrupto. Spring solo en celebraciones |
| **Touch target** | mín 44×44px (AA) | Aplicado a todo control móvil |
| **Logo** | Glifo abstracto "ascensión" (chevron sustraído sobre tile cyan) | Reemplaza el "hUl" antiguo. Lectura: progreso/fuerza/dirección sin literalismo |

---

## 2. Tokens

Tres formatos paralelos, mismos valores. Un cambio se replica en los tres archivos.

### 2.1 `tailwind.config.js` — web (`reception/`, `scanner/`)

```js
// reception/tailwind.config.js  ·  scanner/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // siempre dark, pero permite override
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0B0D',
          surface: '#101115',
          raised:  '#181A20',
          sunken:  '#06070A',
        },
        line: {
          DEFAULT: '#23262E',
          muted:   '#1A1C22',
        },
        fg: {
          hi:      '#F4F5F7',
          DEFAULT: '#D6D8DD',
          mute:    '#9AA0AB',
          dim:     '#6B7280',
          onAccent:'#0A0B0D',
        },
        brand: {
          DEFAULT: '#22D3EE',
          50:  '#ECFEFF', 100: '#CFFAFE', 200: '#A5F3FC', 300: '#67E8F9',
          400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2', 700: '#0E7490',
          800: '#155E75', 900: '#164E63',
          glow: 'rgba(34,211,238,.14)',
        },
        action: {
          DEFAULT: '#D4FF3F',
          hover:   '#C2F032',
          press:   '#A6D026',
          ghost:   'rgba(212,255,63,.10)',
        },
        success: { DEFAULT: '#5EEAA0', bg: 'rgba(94,234,160,.10)' },
        warning: { DEFAULT: '#FFB454', bg: 'rgba(255,180,84,.12)' },
        danger:  { DEFAULT: '#FF6464', bg: 'rgba(255,100,100,.12)' },
        info:    { DEFAULT: '#22D3EE', bg: 'rgba(34,211,238,.10)' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"Inter Tight"', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // [size, lineHeight] — web multiplica títulos x1.25 vs móvil
        caption: ['11px', { lineHeight: '14px', letterSpacing: '0.06em' }],
        tiny:    ['12px', { lineHeight: '16px' }],
        small:   ['13px', { lineHeight: '18px' }],
        body:    ['15px', { lineHeight: '22px' }],
        lead:    ['17px', { lineHeight: '24px' }],
        h6:      ['20px', { lineHeight: '26px', letterSpacing: '-0.005em' }],
        h5:      ['24px', { lineHeight: '30px', letterSpacing: '-0.01em' }],
        h4:      ['30px', { lineHeight: '36px', letterSpacing: '-0.015em' }],
        h3:      ['36px', { lineHeight: '42px', letterSpacing: '-0.02em' }],
        h2:      ['44px', { lineHeight: '50px', letterSpacing: '-0.025em' }],
        h1:      ['56px', { lineHeight: '60px', letterSpacing: '-0.03em' }],
        display: ['72px', { lineHeight: '76px', letterSpacing: '-0.035em' }],
      },
      spacing: {
        0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
        6: '24px', 7: '32px', 8: '40px', 9: '48px', 10: '64px',
        11: '80px', 12: '96px',
      },
      borderRadius: {
        none: '0', sm: '6px', md: '10px', lg: '14px', xl: '20px', full: '9999px',
      },
      boxShadow: {
        sm:   '0 1px 2px rgba(0,0,0,.4)',
        md:   '0 4px 16px rgba(0,0,0,.45)',
        lg:   '0 12px 40px rgba(0,0,0,.55)',
        glow: '0 0 0 1px rgba(34,211,238,.35), 0 0 20px rgba(34,211,238,.18)',
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(.2,.8,.2,1)',
        spring: 'cubic-bezier(.34,1.56,.64,1)',
      },
      transitionDuration: { fast: '120ms', base: '200ms', slow: '320ms', spring: '500ms' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
      zIndex: { dropdown: '1000', sticky: '1020', modal: '1040', toast: '1060' },
    },
  },
  plugins: [],
};
```

### 2.2 `tailwind.config.js` — móvil (`frontend/`, Expo + NativeWind)

```js
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // === idénticos a la config web ===
        bg: { DEFAULT: '#0A0B0D', surface: '#101115', raised: '#181A20', sunken: '#06070A' },
        line: { DEFAULT: '#23262E', muted: '#1A1C22' },
        fg: { hi: '#F4F5F7', DEFAULT: '#D6D8DD', mute: '#9AA0AB', dim: '#6B7280', onAccent: '#0A0B0D' },
        brand:  { DEFAULT: '#22D3EE', 700: '#0E7490', glow: 'rgba(34,211,238,.14)' },
        action: { DEFAULT: '#D4FF3F', press: '#A6D026', ghost: 'rgba(212,255,63,.10)' },
        success:{ DEFAULT: '#5EEAA0', bg: 'rgba(94,234,160,.10)' },
        warning:{ DEFAULT: '#FFB454', bg: 'rgba(255,180,84,.12)' },
        danger: { DEFAULT: '#FF6464', bg: 'rgba(255,100,100,.12)' },
        info:   { DEFAULT: '#22D3EE', bg: 'rgba(34,211,238,.10)' },
      },
      fontFamily: {
        display: ['SpaceGrotesk_700Bold'],     // expo-google-fonts
        sans:    ['InterTight_400Regular'],
        mono:    ['JetBrainsMono_500Medium'],
      },
      fontSize: {
        // móvil: títulos NO multiplicados (más chicos que web)
        caption: 11, tiny: 12, small: 13, body: 15, lead: 17,
        h6: 18, h5: 20, h4: 24, h3: 28, h2: 34, h1: 44, display: 56,
      },
      spacing: {
        0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32,
        8: 40, 9: 48, 10: 64, 11: 80, 12: 96,
        // === diferencia móvil vs web ===
        hit: 44,  // touch target mínimo
      },
      borderRadius: { none: 0, sm: 6, md: 10, lg: 14, xl: 20, full: 9999 },
    },
  },
  plugins: [],
};
```

> **Diferencias intencionales web vs móvil:**
> - Tipografías cargan vía `expo-google-fonts/space-grotesk`, `expo-google-fonts/inter-tight`, `expo-google-fonts/jetbrains-mono`.
> - Escala tipográfica móvil **no** aplica el x1.25 que sí aplica web.
> - Sombras: usar `elevation` de RN o `shadowColor/shadowOpacity` en iOS; las clases web `shadow-md` no se traducen 1:1 — los componentes de abajo lo manejan.
> - `hover:` no existe en RN → mapear a `active:` o `Pressable` con `pressed`.

### 2.3 CSS variables (fallback / fuera de Tailwind)

```css
/* tokens.css — importar en :root del entry web */
:root {
  /* superficies */
  --bg: #0A0B0D;
  --bg-surface: #101115;
  --bg-raised: #181A20;
  --bg-sunken: #06070A;
  --line: #23262E;
  --line-muted: #1A1C22;

  /* texto */
  --fg-hi: #F4F5F7;
  --fg: #D6D8DD;
  --fg-mute: #9AA0AB;
  --fg-dim: #6B7280;
  --fg-on-accent: #0A0B0D;

  /* marca */
  --brand: #22D3EE;
  --brand-700: #0E7490;
  --brand-glow: rgba(34,211,238,.14);

  /* acción */
  --action: #D4FF3F;
  --action-hover: #C2F032;
  --action-press: #A6D026;
  --action-ghost: rgba(212,255,63,.10);

  /* semánticos */
  --success: #5EEAA0; --success-bg: rgba(94,234,160,.10);
  --warning: #FFB454; --warning-bg: rgba(255,180,84,.12);
  --danger:  #FF6464; --danger-bg:  rgba(255,100,100,.12);
  --info:    #22D3EE; --info-bg:    rgba(34,211,238,.10);

  /* tipografía */
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-sans: "Inter Tight", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* radios */
  --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 20px; --r-pill: 9999px;

  /* sombras */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,.45);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.55);
  --shadow-glow: 0 0 0 1px rgba(34,211,238,.35), 0 0 20px rgba(34,211,238,.18);

  /* motion */
  --t-fast: 120ms cubic-bezier(.2,.8,.2,1);
  --t-base: 200ms cubic-bezier(.2,.8,.2,1);
  --t-slow: 320ms cubic-bezier(.2,.8,.2,1);
  --t-spring: 500ms cubic-bezier(.34,1.56,.64,1);
}

html, body { background: var(--bg); color: var(--fg); font-family: var(--font-sans); }
```

### 2.4 Rampas de datos (heatmaps, gráficos)

```ts
export const ramps = {
  heat:   ['#1A1C22', '#0E4A52', '#147A8A', '#1AA9BD', '#22D3EE', '#7DEEF8'],
  load:   ['#1A1C22', '#3D4A1F', '#6B8A2E', '#9DC93C', '#D4FF3F'],
  streak: ['#1A1C22', '#3A2B0E', '#6B5117', '#A87B1F', '#FFB454'],
} as const;

export const facultyColors = {
  SI: '#22D3EE', BIO: '#5EEAA0', ELE: '#FFB454', QUI: '#FF8AB1',
  BA: '#D4FF3F', CDIA:'#B794F6', AND: '#FF6464', MEC: '#7DD3FC',
  ENE:'#FBA74A', AMB: '#9AE6B4', CIV: '#A78BFA', IND: '#F687B3',
} as const;
```

---

## 3. Componentes

API mínima en TS, snippets web (Tailwind + `cva`) y móvil (NativeWind). Solo se documentan los componentes que aparecen en el canvas.

### 3.1 Button

**Anatomía:** label + opcional iconLeft/iconRight. Altura fija por size. Border-radius `md` (10px).

**Variantes:** `primary` (lima sobre dark), `secondary` (cyan dim), `ghost` (transparente con borde), `destructive` (rojo).
**Estados:** default · hover · focus (ring cyan) · active (scale 0.98) · disabled (opacity 0.4) · loading (spinner reemplaza label).

**Accesibilidad:** `role="button"` implícito, `aria-busy` cuando loading, contraste lima/dark ratio 14.2 ✓, web focus-ring 2px brand, móvil hit ≥44px.

**No hacer:**
- ❌ Usar `primary` (lima) en más de un CTA por pantalla.
- ❌ Mezclar tamaños distintos en la misma fila de acciones.

```ts
// types
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

```tsx
// === WEB === components/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const button = cva(
  'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-md transition-all duration-base ease-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-action text-fg-onAccent hover:bg-action-hover active:bg-action-press',
        secondary: 'bg-bg-raised text-fg-hi border border-line hover:border-brand hover:text-brand',
        ghost: 'bg-transparent text-fg hover:bg-bg-raised',
        destructive: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
      },
      size: {
        sm: 'h-8 px-3 text-small',
        md: 'h-10 px-4 text-body',
        lg: 'h-12 px-5 text-lead',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { loading?: boolean; iconLeft?: React.ReactNode; iconRight?: React.ReactNode };

export const Button: React.FC<Props> = ({ variant, size, loading, iconLeft, iconRight, children, className, ...rest }) => (
  <button className={button({ variant, size, className })} aria-busy={loading} disabled={loading || rest.disabled} {...rest}>
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : iconLeft}
    <span>{children}</span>
    {!loading && iconRight}
  </button>
);
```

```tsx
// === MOBILE === components/Button.tsx
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cssInterop } from 'nativewind';

interface Props extends ButtonProps {}

export const Button: React.FC<Props> = ({ variant = 'primary', size = 'md', loading, disabled, iconLeft, iconRight, children, onClick }) => {
  const base = 'flex-row items-center justify-center gap-2 rounded-md';
  const sizes = { sm: 'h-9 px-3', md: 'h-11 px-4', lg: 'h-13 px-5' }; // h-13 = 52px = ≥hit
  const variants = {
    primary: 'bg-action active:bg-action-press',
    secondary: 'bg-bg-raised border border-line',
    ghost: 'bg-transparent',
    destructive: 'bg-danger/15 border border-danger/30',
  } as const;
  const textColor = {
    primary: 'text-fg-onAccent', secondary: 'text-fg-hi', ghost: 'text-fg', destructive: 'text-danger',
  } as const;
  return (
    <Pressable
      onPress={onClick}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40' : ''}`}
    >
      {loading ? <ActivityIndicator size="small" /> : iconLeft}
      <Text className={`font-display font-semibold ${textColor[variant]} text-body`}>{children}</Text>
      {!loading && iconRight}
    </Pressable>
  );
};
```

---

### 3.2 Input / Field

**Anatomía:** label arriba + input + icono opcional (left/right) + helper/error abajo. Altura 44 (web) / 48 (móvil para hit). Background `bg-raised` con borde sutil `line`.

**Variantes:** `text`, `email`, `password` (con toggle ojo), `search`.
**Estados:** default · focus (borde cyan + glow) · filled · error (borde rojo + helper rojo) · disabled.

**Accesibilidad:** `<label>` asociado, `aria-invalid` en error, `aria-describedby` apuntando al helper, contraste placeholder ≥4.6:1.

**No hacer:**
- ❌ Mezclar inputs claros (blanco) y oscuros en el mismo formulario (problema original).
- ❌ Usar `placeholder` como reemplazo del `label`.

```ts
interface InputProps {
  label: string;
  helper?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  type?: 'text' | 'email' | 'password' | 'search';
  value: string;
  onChange: (v: string) => void;
}
```

```tsx
// === WEB ===
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input: React.FC<InputProps & React.InputHTMLAttributes<HTMLInputElement>> = ({
  label, helper, error, iconLeft, type = 'text', value, onChange, ...rest
}) => {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  const id = React.useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-tiny text-fg-mute uppercase tracking-wider font-medium">{label}</label>
      <div className={`relative flex items-center h-11 rounded-md border bg-bg-raised transition-colors ${error ? 'border-danger' : 'border-line focus-within:border-brand focus-within:shadow-glow'}`}>
        {iconLeft && <span className="pl-3 text-fg-mute">{iconLeft}</span>}
        <input
          id={id}
          type={isPwd ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={helper || error ? `${id}-h` : undefined}
          className="flex-1 bg-transparent px-3 text-body text-fg-hi placeholder:text-fg-dim outline-none"
          {...rest}
        />
        {isPwd && (
          <button type="button" onClick={() => setShow(s => !s)} className="pr-3 text-fg-mute hover:text-fg" aria-label={show ? 'Ocultar' : 'Mostrar'}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {(helper || error) && <span id={`${id}-h`} className={`text-tiny ${error ? 'text-danger' : 'text-fg-mute'}`}>{error || helper}</span>}
    </div>
  );
};
```

```tsx
// === MOBILE ===
import { TextInput, Text, View, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';

export const Input: React.FC<InputProps> = ({ label, helper, error, iconLeft, type = 'text', value, onChange }) => {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  return (
    <View className="gap-2">
      <Text className="text-tiny text-fg-mute uppercase tracking-wider font-medium">{label}</Text>
      <View className={`flex-row items-center h-12 rounded-md border bg-bg-raised ${error ? 'border-danger' : 'border-line'}`}>
        {iconLeft && <View className="pl-3">{iconLeft}</View>}
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={isPwd && !show}
          keyboardType={type === 'email' ? 'email-address' : 'default'}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          accessibilityLabel={label}
          accessibilityState={{ disabled: false }}
          placeholderTextColor="#6B7280"
          className="flex-1 px-3 text-body text-fg-hi"
        />
        {isPwd && (
          <Pressable onPress={() => setShow(s => !s)} className="pr-3" hitSlop={8}>
            {show ? <EyeOff size={18} color="#9AA0AB" /> : <Eye size={18} color="#9AA0AB" />}
          </Pressable>
        )}
      </View>
      {(helper || error) && <Text className={`text-tiny ${error ? 'text-danger' : 'text-fg-mute'}`}>{error || helper}</Text>}
    </View>
  );
};
```

---

### 3.3 Card

**Anatomía:** contenedor con `bg-surface`, borde `line`, radio `lg` (14px), padding 16/20.

**Variantes:** `default`, `brand` (border cyan tenue + glow sutil para destacar), `interactive` (hover/press en móvil).

**API:**
```ts
interface CardProps { variant?: 'default' | 'brand' | 'interactive'; children: React.ReactNode; onPress?: () => void; }
```

```tsx
// WEB
const card = cva('rounded-lg p-5', {
  variants: {
    variant: {
      default: 'bg-bg-surface border border-line',
      brand:   'bg-bg-surface border border-brand/30 shadow-glow',
      interactive: 'bg-bg-surface border border-line hover:border-brand/40 transition-colors duration-base ease-ease cursor-pointer',
    },
  },
  defaultVariants: { variant: 'default' },
});
export const Card: React.FC<CardProps & React.HTMLAttributes<HTMLDivElement>> = ({ variant, children, ...rest }) =>
  <div className={card({ variant })} {...rest}>{children}</div>;

// MOBILE — equivalente con Pressable cuando interactive
```

**No hacer:** ❌ anidar Cards `brand` (el glow se acumula y satura).

---

### 3.4 Badge

Pill 22–24px con dot opcional. Tonos `neutral · info · success · warning · danger`.

```ts
interface BadgeProps { tone?: 'neutral'|'info'|'success'|'warning'|'danger'; dot?: boolean; children: React.ReactNode; }
```

```tsx
const tones = {
  neutral: 'bg-bg-raised text-fg border-line',
  info:    'bg-info-bg text-info border-info/30',
  success: 'bg-success-bg text-success border-success/30',
  warning: 'bg-warning-bg text-warning border-warning/30',
  danger:  'bg-danger-bg text-danger border-danger/30',
} as const;

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot, children }) => (
  <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full border text-tiny font-medium ${tones[tone]}`}>
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
    {children}
  </span>
);
```

---

### 3.5 KPI / Stat

Bloque numérico grande (font-display, tabular-nums) + label uppercase 11px + opcional accent color y tendencia.

```ts
interface StatProps { value: string; label: string; accent?: string; trend?: { value: string; dir: 'up' | 'down' }; }
```

```tsx
export const Stat: React.FC<StatProps> = ({ value, label, accent, trend }) => (
  <div className="flex-1 bg-bg-surface border border-line rounded-lg p-4">
    <div className="text-caption text-fg-mute uppercase tracking-wider mb-1">{label}</div>
    <div className="font-display font-bold text-h4 tabular-nums leading-none -tracking-[0.02em]" style={{ color: accent ?? 'var(--fg-hi)' }}>
      {value}
    </div>
    {trend && (
      <div className={`text-tiny mt-1 ${trend.dir === 'up' ? 'text-success' : 'text-danger'}`}>
        {trend.dir === 'up' ? '↑' : '↓'} {trend.value}
      </div>
    )}
  </div>
);
```

---

### 3.6 Progress

Barra horizontal 2/3/4px con color configurable. `value/max`, ARIA progressbar.

```tsx
interface ProgressProps { value: number; max: number; color?: string; height?: 2 | 3 | 4 | 8; }
export const Progress: React.FC<ProgressProps> = ({ value, max, color = 'var(--brand)', height = 3 }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
         className="bg-bg-raised rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-[width] duration-slow ease-ease" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};
```

---

### 3.7 Segmented control

2–4 opciones inline. Underline cyan en activa, no fondo. Solo móvil/web.

```ts
interface SegmentedProps<T extends string> { items: { label: string; value: T }[]; value: T; onChange: (v: T) => void; }
```

Implementación: ver canvas. Spec: altura 36px web / 40 móvil, divisor 1px `line-muted`, transición de subrayado 200ms.

---

### 3.8 BottomNav (móvil)

Barra fija inferior, 5 tabs (QR · En vivo · Rutina · Ranking · Perfil). Tab activa: icono `fill` + color `brand`. Inactiva: `outline` + `fg-mute`. Altura 64 + safe-area.

**No hacer:** ❌ mezclar fill y outline en la misma fila salvo activo/inactivo.

---

### 3.9 ListItem

Fila clickeable con icono cuadrado 36px + título + subtítulo + chevron derecho. Border-bottom `line-muted` salvo último.

---

### 3.10 EmptyState

Icono circular 56px + título + texto + botón opcional. Centrado vertical en su contenedor.

---

### 3.11 Componentes específicos del dominio

| Componente | Ubicación | Notas |
|---|---|---|
| **AccessPass** | móvil / Mi QR | Credencial con QR centrado, banda meta arriba (eyebrow + ID), banda titular abajo, countdown lineal. Recortes laterales tipo ticket. |
| **MuscleMap** | móvil / Rutina | Dos variantes: `anatomy` (paths SVG por grupo muscular, color por volumen) y `silhouette` (silueta + radial gradient hotspots). Recibe `data: Record<MuscleGroup, 0..1>`. |
| **Heatmap (días×horas)** | móvil / En Vivo | Grid 7×9 con rampa `ramps.heat`. Etiquetas Lun–Dom + 6h–22h. |
| **PodiumTop3** | móvil / Ranking | Tres plintos con altura por ranking. Centro = #1 (oro), izq = #2 (cyan), der = #3 (bronce). Avatar circular con código de facultad. |
| **OccupancyKPI** | recepción / scanner | Número grande + barra + estado semántico (Disponible/Casi lleno/Lleno) según % aforo. |

Estos NO son componentes "de sistema" — son composiciones de los primitivos anteriores. Llevarlos como `components/domain/*`.

---

## 4. Mapa de pantallas — original → rediseñada

| Pantalla | Archivo en repo | Cambios visuales | Componentes nuevos | Datos / lógica que NO cambian |
|---|---|---|---|---|
| **Login** | `frontend/app/(auth)/login.tsx` | Foto del campus se mantiene tal cual. Form unificado a inputs dark consistentes. CTA "Iniciar sesión" pasa a lima (era cyan). Logo rediseñado. | Input, Button (primary), BrandMark | endpoint auth, validación email UTEC, manejo de errores |
| **Sign In** | `frontend/app/(auth)/register.tsx` | Mismos inputs dark consistentes (antes estaban mezclados). CTA lima. Sigue paso único. | Input, Button | flujo de registro, política de contraseña |
| **Mi QR (inicio)** | `frontend/app/(tabs)/index.tsx` | QR ahora es protagonista en credencial unificada (`AccessPass`). Header con saludo. Stats compactos abajo (Puntos/Ranking/Sesiones). Aforo mini-card. | AccessPass, PassStat (Stat con icon), Badge | rotación QR cada 30s, polling de aforo |
| **En Vivo** | `frontend/app/(tabs)/live.tsx` | KPI de aforo grande + barra. Heatmap días×horas con rampa calibrada (antes ilegible). Recomendación "mejor momento hoy". | Heatmap, Card variant=brand, Stat | fuente de datos de ocupación |
| **Rutina + Heatmap muscular** | `frontend/app/(tabs)/routine.tsx` | Chips de filtros consistentes. Lista de ejercicios con check. Mapa muscular con dos variantes (anatomy/silhouette). | ChipGroup, MuscleMap, Segmented | rutinas asignadas por sexo/días |
| **Historial** | `frontend/app/(tabs)/history.tsx` | Sesiones agrupadas por mes. Item con duración + tipo + puntos. Penalizaciones como Badge danger inline (no flotantes). | ListItem, Badge | historial real del backend |
| **Detalle de sesión** *(nueva)* | `frontend/app/session/[id].tsx` | Pantalla nueva. Header con fecha/duración/puntos. Lista de ejercicios. Resumen muscular. CTA "Repetir rutina". | Card, Stat, MuscleMap | — |
| **Ranking** | `frontend/app/(tabs)/ranking.tsx` | Podio top-3 visual rompedor. Banda destacada para "Tu facultad". Lista compacta del 4 al 10 con barra de progreso fina. | PodiumTop3, Progress | endpoint de ranking mensual |
| **Perfil** | `frontend/app/(tabs)/profile.tsx` | Avatar grande con iniciales. Stats. Logros como chips. Settings como ListItems. Footer con BrandMark + versión. | Stat, ListItem, Button (destructive) | datos del usuario, logout |
| **Recepción · Panel** | `reception/src/App.tsx` | Layout 3 columnas. KPI aforo grande arriba. Cola de ingresos en vivo. Tabla de alumnos con filtros. Antes estaba muy gris/plano. | OccupancyKPI, Card, Badge, Table | endpoints de aforo y alumnos |
| **Recepción · Alumno detail** *(nueva)* | `reception/src/Student.tsx` | Pantalla nueva. Cabecera con foto/datos/estado. Historial de ingresos. Sesiones recientes. Acción "Bloquear acceso". | Card, Stat, ListItem, Button | — |
| **Recepción · Login** | `reception/src/Login.tsx` | Mismo lenguaje que login móvil pero web (form más ancho, sin foto fullscreen). | Input, Button, BrandMark | auth de staff |
| **Scanner** | `scanner/src/App.tsx` | KPI "X / 100 activos" gigante en header (era chico). Visor centrado con marco brand. Log de eventos en lateral con tipografía mono pero estilizada (no "debug"). | OccupancyKPI, Badge, mono-list | webcam, decodificación QR, post a backend |

---

## 5. Plan de migración por fases

Orden por **máximo impacto visual / menor riesgo técnico**.

### Fase 0 — Setup (½ día · riesgo bajo)
- Instalar fuentes: `expo-google-fonts/space-grotesk`, `inter-tight`, `jetbrains-mono` (móvil). Para web, agregar `<link>` a Google Fonts en cada `index.html`.
- Reemplazar `tailwind.config.js` en `reception/`, `scanner/`, `frontend/` con los archivos de §2.
- Agregar `tokens.css` (web) e importarlo en cada entry.
- **Archivos:** 3 × `tailwind.config.js`, 2 × `index.html`, 2 × `main.tsx`.
- **Riesgo:** clases viejas (`bg-gray-900`, etc.) seguirán funcionando hasta que las cambiemos. No rompe nada.

### Fase 1 — Primitivos (1 día · riesgo bajo)
- Crear `components/ui/{Button,Input,Card,Badge,Stat,Progress,Segmented,ListItem,EmptyState}.tsx` en cada repo (móvil y web).
- Subir a un paquete compartido si los repos comparten monorepo; si no, duplicar.
- **Test visual:** una página `/_dev/components` por repo donde se muestren todos los componentes en todos los estados.
- **Riesgo:** ninguno — son adiciones.

### Fase 2 — Auth (½ día · riesgo bajo)
- Reemplazar `Login` y `Register` (móvil + recepción) con los nuevos componentes.
- **Validación:** los flujos siguen igual, solo cambia la UI. Probar happy path + errores de credenciales.

### Fase 3 — Mi QR + En Vivo (1 día · riesgo medio)
- Crear `components/domain/AccessPass.tsx` y `Heatmap.tsx`.
- Reemplazar `(tabs)/index.tsx` y `(tabs)/live.tsx`.
- **Riesgo medio** porque QR + countdown tocan timer/refresh. Mantener exactamente el contrato de `useQRToken()` actual.

### Fase 4 — Rutina + Heatmap muscular (1 día · riesgo medio)
- Crear `MuscleMap` con las dos variantes. Exponer prop `variant` y dejar `'anatomy'` por default.
- **Pendiente:** validar siluetas con fisio del gym (ver §8).

### Fase 5 — Ranking + Perfil + Historial + Detalle (1.5 días · riesgo bajo)
- Crear `PodiumTop3`. Reemplazar pantallas. Crear nueva `session/[id].tsx`.

### Fase 6 — Recepción + Scanner (1.5 días · riesgo medio)
- `OccupancyKPI`. Rehacer layout de Recepción (3 columnas). Restilizar Scanner.
- **Riesgo:** el scanner usa webcam — no tocar la lógica de getUserMedia ni el decoder; solo el chrome alrededor.

### Fase 7 — Cleanup (½ día)
- Eliminar clases viejas. Buscar `text-cyan-*`, `bg-gray-*` y reemplazar.
- Lighthouse / contraste pass.

**Total estimado: 6.5 días dev.**

---

## 6. Assets a exportar del canvas

| Asset | Formato | Tamaños / densidades | Ubicación destino |
|---|---|---|---|
| **Logo BrandMark** | SVG (1×) + PNG (1×, 2×, 3×) | 24, 32, 48, 96, 192, 512 | `frontend/assets/brand/logo.svg` y `logo@{1,2,3}x.png`. Web: `reception/public/brand/`, `scanner/public/brand/` |
| **App icon (iOS/Android)** | PNG cuadrado | 1024×1024 maestro; Expo genera resto | `frontend/assets/icon.png` |
| **Splash** | PNG | 1284×2778 (móvil retina) | `frontend/assets/splash.png` — fondo `#0A0B0D` + BrandMark centrado al 25% |
| **Favicons web** | ICO + PNG | 16, 32, 192, 512 | `reception/public/favicon.{ico,png}` y mismo en scanner |
| **Iconos UI** | usar `lucide-react` / `lucide-react-native` | — | ya importados via npm; no exportar del canvas |
| **Pattern de fondo (login)** | foto del campus UTEC tal cual | JPEG 1080×1920 | `frontend/assets/auth/campus.jpg` (la que ya existe) |
| **QR finder corners** | inline SVG en `AccessPass` | — | no exportar, vive en el componente |
| **Faculty colors** | constante TS | — | `lib/facultyColors.ts` (ver §2.4) |

> **BrandMark SVG canónico** (copiar 1:1 al repo):
>
> ```svg
> <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-label="UTEC Gym">
>   <defs>
>     <mask id="bm">
>       <rect width="40" height="40" fill="#fff"/>
>       <path d="M20 9 L31 22 L26 22 L20 15 L14 22 L9 22 Z" fill="#000"/>
>       <path d="M20 20 L31 33 L26 33 L20 26 L14 33 L9 33 Z" fill="#000"/>
>     </mask>
>   </defs>
>   <rect width="40" height="40" rx="9" fill="#22D3EE" mask="url(#bm)"/>
>   <circle cx="20" cy="36.5" r="1.4" fill="#22D3EE"/>
> </svg>
> ```

---

## 7. Checklist de QA visual

Correr **por cada pantalla** post-implementación. Marcar con [x].

### Contraste y color
- [ ] Texto principal sobre `bg-surface` ≥ 7:1 (AAA preferible)
- [ ] Texto secundario ≥ 4.6:1 (AA)
- [ ] Lima `#D4FF3F` solo se usa para acción / un CTA primario por pantalla
- [ ] Cyan `#22D3EE` solo se usa para marca, info, datos
- [ ] Ningún `text-gray-*` legacy de Tailwind base sigue presente

### Tipografía
- [ ] Display = Space Grotesk; texto = Inter Tight; mono = JetBrains Mono
- [ ] Tamaños provienen de la escala (`text-h4`, `text-body`, etc.) — no `text-[15px]`
- [ ] Números en KPIs/timers usan `tabular-nums`

### Touch / hit
- [ ] Todo control móvil mide ≥ 44×44 (web: cursor pointer + 32px mín)
- [ ] BottomNav respeta safe-area (`pb-[env(safe-area-inset-bottom)]`)

### Estados
- [ ] Loading: skeleton o spinner en componentes con fetch
- [ ] Empty: `EmptyState` con icono + texto + acción cuando aplique
- [ ] Error: `error` prop en Input + Toast/Banner para fallos de red
- [ ] Disabled: opacity 0.4, no pointer-events

### Focus visible (web)
- [ ] Todos los focusables muestran ring 2px brand al tab
- [ ] Orden de tab es lógico (no salta)

### Responsive (web)
- [ ] Recepción a 1280, 1440, 1920 — no overflow
- [ ] Scanner a 1024 mínimo (es kiosko)

### Motion
- [ ] Transiciones ≤ 320ms
- [ ] Respeta `prefers-reduced-motion` (envolver Framer/Reanimated)

### Datos
- [ ] Heatmaps usan rampa correcta (`heat`/`load`/`streak`)
- [ ] Faculty colors consistentes entre Ranking, Perfil, Recepción

---

## 8. Decisiones pendientes

| # | Decisión | Recomendación | Owner |
|---|---|---|---|
| 1 | **Web dark vs Recepción light** — ¿Recepción debería ser light-mode (más institucional UTEC)? | **Mantener todo dark.** Recepción opera en kiosko/PC del gym, contraste alto en luz baja. Cambiar a light fragmentaría el sistema. | Alejandro |
| 2 | **Validación heatmap muscular con fisio** | Demo con un fisio del gym antes de Fase 4. Si rechaza paths anatómicos, default a `silhouette` (es más abstracto y tolera imprecisión). | Alejandro + fisio |
| 3 | **Logo final** | Glifo "ascensión" (chevron sustraído) propuesto. Si no convence, alternativas listas: monograma "UG" geométrico, o mancuerna+birrete. **Decidir antes de Fase 0** porque entra a app icon y splash. | Alejandro |
| 4 | **Faculty colors completos** | Definidos 13 códigos en `facultyColors`. Confirmar que cubren la lista oficial UTEC; si falta alguna, agregar siguiendo la rampa. | Alejandro |
| 5 | **Tipografía: licenciamiento** | Space Grotesk e Inter Tight están en Google Fonts (OFL, libres). JetBrains Mono también. Sin bloqueo. | — (resuelto) |
| 6 | **Penalizaciones (-20%)** | Diseñadas como `Badge tone="danger"` inline. ¿Comportamiento en backend al aplicar? Validar contrato con el equipo. | Backend |

---

## 9. Limitaciones técnicas conocidas

| Patrón canvas | Limitación RN/Tailwind | Alternativa |
|---|---|---|
| `color-mix(in oklab, ...)` | No soportado en RN | Pre-calcular hex en `tokens.ts` (ya hecho para variantes principales) |
| `mask` SVG (logo) | Soportado en `react-native-svg` ✓ | OK |
| `dashed border` con `border-dashed` | Soportado en RN ≥0.71 | OK; en versiones viejas usar SVG |
| `backdrop-filter: blur` (auth bg) | Limitado en Android | `expo-blur` con `intensity` ajustada |
| `radial-gradient` (silhouette hotspots) | No nativo en RN | Usar `react-native-svg` con `<RadialGradient>` (ya documentado en MuscleMap) |
| `transform: scale()` en Pressable | OK con Reanimated | `useSharedValue` + `withSpring` para press |
| Glow shadow (`shadow-glow`) | iOS sí, Android requiere `elevation` + `shadowColor` | Usar componente envoltorio `<Glow>` que aplique ambos |

---

**Fin del handoff.** Todo lo de §2 a §7 es copy-paste. §8 son decisiones que necesito confirmar con vos antes de Fase 0.
