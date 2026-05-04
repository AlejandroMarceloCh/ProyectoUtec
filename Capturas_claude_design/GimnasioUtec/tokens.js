/* UTEC GYM — Design System Tokens
 * Single source of truth para los 3 clientes (móvil RN+NativeWind, web Recepción, Scanner).
 * Exportable a tailwind.config.js / nativewind sin transformaciones.
 */

window.UTEC_TOKENS = {
  // ── COLOR ────────────────────────────────────────────────────────────────
  color: {
    // Superficies (escala de grises calibrada para AA sobre negro)
    bg: {
      base:    '#0A0B0D',  // canvas
      surface: '#101115',  // cards
      raised:  '#181A20',  // inputs / hover
      sunken:  '#06070A',  // pozos, headers fijos
      line:    '#23262E',  // bordes 1px
      lineMuted: '#1A1C22'
    },

    // Texto sobre dark
    fg: {
      hi:   '#F4F5F7',     // títulos                ratio 16.8 ✓
      base: '#D6D8DD',     // cuerpo                 ratio 12.4 ✓
      mute: '#9AA0AB',     // secundario             ratio 6.1 ✓
      dim:  '#6B7280',     // labels chicos          ratio 4.6 ✓ (AA mín)
      onAccent: '#0A0B0D'  // texto sobre cyan/lima
    },

    // MARCA UTEC
    brand: {
      cyan:    '#22D3EE',  // cyan calibrado, accesible. Marca.
      cyanDim: '#0E7490',
      cyanGlow:'rgba(34, 211, 238, 0.14)'
    },

    // ACCIÓN — lima eléctrico, separado de marca
    action: {
      base:  '#D4FF3F',
      hover: '#C2F032',
      press: '#A6D026',
      ghost: 'rgba(212, 255, 63, 0.10)'
    },

    // SEMÁNTICOS
    state: {
      success:    '#5EEAA0',
      successBg:  'rgba(94, 234, 160, 0.10)',
      warning:    '#FFB454',
      warningBg:  'rgba(255, 180, 84, 0.12)',
      danger:     '#FF6464',
      dangerBg:   'rgba(255, 100, 100, 0.12)',
      info:       '#22D3EE',
      infoBg:     'rgba(34, 211, 238, 0.10)'
    },

    // RAMPAS DE DATOS (mapa de calor, gráficos)
    ramp: {
      heat: ['#1A1C22', '#0E4A52', '#147A8A', '#1AA9BD', '#22D3EE', '#7DEEF8'],
      load: ['#1A1C22', '#3D4A1F', '#6B8A2E', '#9DC93C', '#D4FF3F'],
      streak: ['#1A1C22', '#3A2B0E', '#6B5117', '#A87B1F', '#FFB454']
    },

    // FACULTADES (chips de carrera — UTEC tiene ~10)
    faculty: {
      SI:   '#22D3EE', BIO:  '#5EEAA0', ELE:  '#FFB454',
      QUI:  '#FF8AB1', BA:   '#D4FF3F', CDIA: '#B794F6',
      AND:  '#FF6464', MEC:  '#7DD3FC', ENE:  '#FBA74A',
      AMB:  '#9AE6B4', CIV:  '#A78BFA', MEC2: '#60A5FA',
      IND:  '#F687B3'
    }
  },

  // ── TYPE ─────────────────────────────────────────────────────────────────
  font: {
    display: '"Space Grotesk", system-ui, sans-serif',
    text:    '"Inter Tight", system-ui, -apple-system, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, monospace'
  },

  // Escala — móvil base. Web multiplica títulos por 1.25.
  size: {
    'caption': '11px',  // labels micro, all-caps
    'tiny':    '12px',
    'small':   '13px',
    'body':    '15px',  // texto base móvil
    'lead':    '17px',
    'h6':      '18px',
    'h5':      '20px',
    'h4':      '24px',
    'h3':      '28px',
    'h2':      '34px',
    'h1':      '44px',
    'display': '56px'
  },

  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },

  // ── SPACING (4-base) ─────────────────────────────────────────────────────
  space: {
    0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px',
    5: '20px', 6: '24px', 7: '32px', 8: '40px', 9: '48px',
    10: '64px', 11: '80px', 12: '96px'
  },

  // ── RADII ────────────────────────────────────────────────────────────────
  radius: {
    none: '0',
    sm:   '6px',    // chips/pills chicos
    md:   '10px',   // inputs, botones
    lg:   '14px',   // cards
    xl:   '20px',   // contenedores grandes
    pill: '999px'
  },

  // ── ELEVATION ───────────────────────────────────────────────────────────
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,.4)',
    md: '0 4px 16px rgba(0,0,0,.45)',
    lg: '0 12px 40px rgba(0,0,0,.55)',
    glow: '0 0 0 1px rgba(34,211,238,.35), 0 0 20px rgba(34,211,238,.18)'
  },

  // ── MOTION ──────────────────────────────────────────────────────────────
  motion: {
    fast:   '120ms cubic-bezier(.2,.8,.2,1)',
    base:   '200ms cubic-bezier(.2,.8,.2,1)',
    slow:   '320ms cubic-bezier(.2,.8,.2,1)',
    spring: '500ms cubic-bezier(.34,1.56,.64,1)'
  },

  // ── TARGETS ─────────────────────────────────────────────────────────────
  hit: { min: 44 }   // px, AA
};
