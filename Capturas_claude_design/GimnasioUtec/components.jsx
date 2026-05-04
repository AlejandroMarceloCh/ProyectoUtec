/* UTEC GYM — Componentes compartidos
 * Solo presentational. Siguen los tokens de tokens.js / styles.css
 */

// ── Brand mark · Glifo abstracto "ascensión" ─────────────────────────────
// Cuadrado de marca con un chevron ascendente formado por sustracción.
// Lectura: progreso, fuerza, dirección. Cero literalismo, máxima identidad.
const BrandMark = ({ size = 28, color = 'var(--brand)', bg = 'var(--bg)' }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="UTEC Gym">
      <defs>
        <mask id={`bm-${id}`}>
          {/* fondo del mask = visible */}
          <rect width="40" height="40" fill="#fff"/>
          {/* chevron grande recortado (apunta arriba) */}
          <path d="M20 9 L31 22 L26 22 L20 15 L14 22 L9 22 Z" fill="#000"/>
          {/* chevron menor recortado (segundo escalón) */}
          <path d="M20 20 L31 33 L26 33 L20 26 L14 33 L9 33 Z" fill="#000"/>
        </mask>
      </defs>
      {/* tile cuadrado redondeado de color marca */}
      <rect x="0" y="0" width="40" height="40" rx="9" fill={color} mask={`url(#bm-${id})`}/>
      {/* punto/acento en la base — anclaje del glifo */}
      <circle cx="20" cy="36.5" r="1.4" fill={color}/>
    </svg>
  );
};

// ── Iconos (line, 24px, stroke 1.6) ────────────────────────────────────────
const I = ({ d, size = 22, stroke = 'currentColor', sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const Icons = {
  qr: <I d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/></>}/>,
  pulse: <I d={<path d="M3 12h4l3-8 4 16 3-8h4"/>}/>,
  routine: <I d={<><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M3 6h2M19 6h2M3 18h2M19 18h2M8 6v12M16 6v12"/></>}/>,
  history: <I d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>,
  ranking: <I d={<><path d="M4 20V10M12 20V4M20 20v-7"/></>}/>,
  user: <I d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></>}/>,
  bell: <I d={<><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 18a2 2 0 0 0 4 0"/></>}/>,
  lock: <I d={<><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>}/>,
  help: <I d={<><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/></>}/>,
  logout: <I d={<><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 12h12M16 8l4 4-4 4"/></>}/>,
  chev: <I d={<path d="M9 6l6 6-6 6"/>}/>,
  search: <I d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  eye: <I d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>}/>,
  plus: <I d={<path d="M12 5v14M5 12h14"/>}/>,
  check: <I d={<path d="M5 12l5 5L20 7"/>}/>,
  x: <I d={<path d="M6 6l12 12M18 6L6 18"/>}/>,
  mail: <I d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></>}/>,
  flame: <I d={<path d="M12 3c0 4-5 5-5 10a5 5 0 0 0 10 0c0-3-2-4-2-7 0-1 1-2 1-2-2 0-4 1-4-1z"/>}/>,
  trophy: <I d={<><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 19h6M12 14v5"/></>}/>,
  refresh: <I d={<><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>}/>,
  zap: <I d={<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>}/>,
  clock: <I d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>,
  building: <I d={<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6"/></>}/>,
  pin: <I d={<><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></>}/>,
  shield: <I d={<path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z"/>}/>,
  scan: <I d={<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>}/>,
  arrow: <I d={<path d="M5 12h14M13 6l6 6-6 6"/>}/>
};

// ── Botones ───────────────────────────────────────────────────────────────
const Button = ({ variant = 'primary', size, icon, children, full, onClick, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''}`}
    style={{ width: full ? '100%' : undefined }}
  >
    {icon && <span style={{ display: 'flex' }}>{icon}</span>}
    {children}
  </button>
);

// ── Input ─────────────────────────────────────────────────────────────────
const Field = ({ label, hint, error, children }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label className="ds-label">{label}</label>}
    {children}
    {hint && !error && <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 6 }}>{hint}</div>}
    {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
  </div>
);

const Input = React.forwardRef(({ leftIcon, rightSlot, ...props }, ref) => (
  <div style={{ position: 'relative' }}>
    {leftIcon && (
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-mute)', display: 'flex' }}>
        {leftIcon}
      </span>
    )}
    <input
      ref={ref}
      {...props}
      className="ds-input"
      style={{
        paddingLeft: leftIcon ? 40 : 14,
        paddingRight: rightSlot ? 44 : 14,
        ...(props.style || {})
      }}
    />
    {rightSlot && (
      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
        {rightSlot}
      </span>
    )}
  </div>
));

// ── Stat ──────────────────────────────────────────────────────────────────
const Stat = ({ value, label, accent, mono }) => (
  <div className="ds-card" style={{ padding: 16, flex: 1 }}>
    <div className="stat-num" style={{ color: accent || 'var(--fg-hi)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
      {value}
    </div>
    <div className="stat-label">{label}</div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────
const Badge = ({ tone = 'neutral', children, dot }) => (
  <span className={`badge badge-${tone}`}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />}
    {children}
  </span>
);

// ── Tabs (segmented) ──────────────────────────────────────────────────────
const Segmented = ({ items, value, onChange }) => (
  <div className="tab-row" role="tablist">
    {items.map(it => (
      <button
        key={it.value}
        role="tab"
        aria-selected={value === it.value}
        data-active={value === it.value}
        className="tab-pill"
        onClick={() => onChange(it.value)}
      >
        {it.label}
      </button>
    ))}
  </div>
);

// ── Bottom nav (móvil) ────────────────────────────────────────────────────
const BottomNav = ({ active, onChange }) => {
  const items = [
    { id: 'qr', label: 'Mi QR', icon: Icons.qr },
    { id: 'live', label: 'En Vivo', icon: Icons.pulse },
    { id: 'routine', label: 'Rutina', icon: Icons.routine },
    { id: 'history', label: 'Historial', icon: Icons.history },
    { id: 'ranking', label: 'Ranking', icon: Icons.ranking },
    { id: 'profile', label: 'Perfil', icon: Icons.user },
  ];
  return (
    <nav style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(10,11,13,.92)', backdropFilter: 'blur(18px)',
      borderTop: '1px solid var(--line-muted)',
      padding: '8px 4px 22px', display: 'flex'
    }}>
      {items.map(it => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            onClick={() => onChange?.(it.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 0', position: 'relative',
              color: isActive ? 'var(--brand)' : 'var(--fg-dim)',
              transition: 'color var(--t-base)'
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute', top: 0, width: 28, height: 2,
                background: 'var(--brand)', borderRadius: 2
              }} />
            )}
            {it.icon}
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// ── Card variants ─────────────────────────────────────────────────────────
const Card = ({ variant = 'default', children, style, ...rest }) => (
  <div className={variant === 'brand' ? 'ds-card-brand' : 'ds-card'} style={{ padding: 16, ...style }} {...rest}>
    {children}
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, body, cta }) => (
  <div className="col center" style={{ padding: '32px 20px', textAlign: 'center', gap: 12 }}>
    <div style={{
      width: 56, height: 56, borderRadius: 999, display: 'grid', placeItems: 'center',
      border: '1.5px dashed var(--line)', color: 'var(--fg-mute)'
    }}>
      {icon}
    </div>
    <div className="font-display" style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg-hi)' }}>{title}</div>
    <div style={{ fontSize: 13, color: 'var(--fg-mute)', maxWidth: 260 }}>{body}</div>
    {cta}
  </div>
);

// ── Progress bar ──────────────────────────────────────────────────────────
const Progress = ({ value, max = 100, color = 'var(--brand)', height = 6 }) => (
  <div style={{ width: '100%', height, background: 'var(--bg-raised)', borderRadius: 999, overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`,
      height: '100%',
      background: color,
      transition: 'width var(--t-base)'
    }} />
  </div>
);

// ── Page header (móvil) ───────────────────────────────────────────────────
const PageHeader = ({ kicker, title, right }) => (
  <header style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
    <div>
      {kicker && <div className="eyebrow" style={{ marginBottom: 4 }}>{kicker}</div>}
      <h1 className="font-display" style={{
        margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg-hi)'
      }}>{title}</h1>
    </div>
    {right}
  </header>
);

// Export al window scope para que otros scripts babel los puedan usar
Object.assign(window, {
  BrandMark, Icons, Button, Field, Input, Stat, Badge, Segmented,
  BottomNav, Card, EmptyState, Progress, PageHeader
});
